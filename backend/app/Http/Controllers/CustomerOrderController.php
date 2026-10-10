<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerPaymentProofRequest;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Services\CloudinaryService;
use App\Services\CloudinaryServiceException;
use App\Services\MediaAssetService;
use App\Services\OrderRequestPresenter;
use App\Services\StaffAdminNotificationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CustomerOrderController extends Controller
{
    private const HISTORY_STATUSES = [
        'completed',
        'rejected',
        'cancelled',
    ];

    public function __construct(
        private readonly OrderRequestPresenter $orderRequestPresenter,
        private readonly StaffAdminNotificationService $staffAdminNotificationService,
        private readonly CloudinaryService $cloudinaryService,
        private readonly MediaAssetService $mediaAssetService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'scope' => ['sometimes', 'string', Rule::in(['active', 'history'])],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $customer = $request->user()?->customer;

        if (! $customer) {
            return response()->json([
                'message' => 'Customer profile not found.',
            ], 404);
        }

        $query = OrderRequest::query()
            ->where('customer_id', $customer->id)
            ->with([
                'branch',
                'pickupRequest:id,order_id,branch_id,pickup_status,pickup_date,pickup_time,remarks,completed_at',
                'deliveryRequest:id,order_id,branch_id,delivery_status,delivery_address,delivery_fee,booking_reference,tracking_url,rider_name,rider_contact,remarks,delivered_at',
                'payments:id,order_id,payment_method,amount,payment_reference,proof_image_url,payment_status,created_at,verified_at',
            ])
            ->withCount('items')
            ->withSum('items', 'quantity')
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $this->applyScope($query, $filters['scope'] ?? null);

        $orders = $query->paginate($filters['per_page'] ?? 10);

        return response()->json([
            'orders' => $orders->getCollection()
                ->map(fn (OrderRequest $order): array => $this->orderRequestPresenter->summary($order))
                ->values(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(Request $request, string $reference): JsonResponse
    {
        $customer = $request->user()?->customer;

        if (! $customer) {
            return response()->json([
                'message' => 'Customer profile not found.',
            ], 404);
        }

        $order = $this->ownedOrderQuery($customer, $reference)
            ->with([
                'branch',
                'customer',
                'items.product:id,part_number,img_url',
                'payments:id,order_id,payment_method,amount,payment_reference,proof_image_url,payment_status,created_at,verified_at',
                'pickupRequest.branch',
                'deliveryRequest.branch',
            ])
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'order' => $this->orderRequestPresenter->detail($order),
        ]);
    }

    public function storePaymentProof(
        StoreCustomerPaymentProofRequest $request,
        string $reference,
    ): JsonResponse {
        $customer = $request->user()?->customer;

        if (! $customer) {
            return response()->json([
                'message' => 'Customer profile not found.',
            ], 404);
        }

        $order = $this->ownedOrderQuery($customer, $reference)
            ->with([
                'branch',
                'customer',
                'items.product:id,part_number,img_url',
                'payments:id,order_id,payment_method,amount,payment_reference,proof_image_url,payment_status,created_at,verified_at',
                'pickupRequest.branch',
                'deliveryRequest.branch',
            ])
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        /** @var Payment|null $payment */
        $payment = $order->payments
            ->sortByDesc(fn (Payment $item): int => $item->created_at?->getTimestamp() ?? 0)
            ->sortByDesc('id')
            ->first();

        if (! $payment) {
            throw ValidationException::withMessages([
                'payment' => ['This order does not have a payment record.'],
            ]);
        }

        if ($payment->payment_method !== Payment::METHOD_ONLINE_PAYMENT) {
            throw ValidationException::withMessages([
                'payment' => ['Payment proof is only available for online payment orders.'],
            ]);
        }

        if (in_array($order->order_status, OrderRequest::TERMINAL_STATUSES, true)) {
            throw ValidationException::withMessages([
                'payment' => ['Payment proof cannot be submitted for a cancelled or closed order.'],
            ]);
        }

        if ($payment->payment_status === Payment::STATUS_PAID) {
            throw ValidationException::withMessages([
                'payment' => ['This payment has already been verified.'],
            ]);
        }

        if ($payment->payment_status === Payment::STATUS_WAITING_FOR_VERIFICATION) {
            throw ValidationException::withMessages([
                'payment' => ['Payment proof is already waiting for staff verification.'],
            ]);
        }

        if (! in_array($payment->payment_status, [
            Payment::STATUS_UNPAID,
            Payment::STATUS_FAILED,
        ], true)) {
            throw ValidationException::withMessages([
                'payment' => ['This payment is not currently eligible for proof submission.'],
            ]);
        }

        if ($payment->payment_status === Payment::STATUS_UNPAID
            && ! in_array($order->order_status, [
                'confirmed',
                'preparing_order',
                'ready_for_pickup',
                'booked_for_delivery',
                'picked_up_by_rider',
            ], true)) {
            throw ValidationException::withMessages([
                'payment' => ['Payment instructions become available after the order is confirmed.'],
            ]);
        }

        $file = $request->file('proof');

        try {
            $asset = $this->cloudinaryService->uploadImage(
                $file,
                'ald-motorshop/payment-proofs/'.$order->order_reference,
            );
        } catch (CloudinaryServiceException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 503);
        }

        try {
            DB::transaction(function () use ($payment, $asset, $request): void {
                $payment->update([
                    'proof_image_url' => $asset['secure_url'],
                    'proof_image_public_id' => $asset['public_id'],
                    'payment_status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
                    'verified_by' => null,
                    'verified_at' => null,
                ]);

                $this->mediaAssetService->registerUploadedAsset(
                    $asset,
                    'payment_proof',
                    'payment',
                    (int) $payment->id,
                    $request->user(),
                );
            });
        } catch (\Throwable $exception) {
            $this->cloudinaryService->deleteImage($asset['public_id']);
            throw $exception;
        }

        $this->staffAdminNotificationService->paymentProofSubmitted($payment->fresh());

        $order->load([
            'branch',
            'customer',
            'items.product:id,part_number,img_url',
            'payments:id,order_id,payment_method,amount,payment_reference,proof_image_url,payment_status,created_at,verified_at',
            'pickupRequest.branch',
            'deliveryRequest.branch',
        ]);

        return response()->json([
            'message' => 'Payment proof submitted for staff verification.',
            'order' => $this->orderRequestPresenter->detail($order),
        ], 201);
    }

    private function ownedOrderQuery(Customer $customer, string $reference): Builder
    {
        return OrderRequest::query()
            ->where('customer_id', $customer->id)
            ->whereRaw('LOWER(order_reference) = ?', [strtolower(trim($reference))]);
    }

    private function applyScope(Builder $query, ?string $scope): void
    {
        if ($scope === 'history') {
            $query->where(function (Builder $history): void {
                $history
                    ->whereRaw('LOWER(order_status) IN (?, ?, ?)', self::HISTORY_STATUSES)
                    ->orWhereHas('pickupRequest', fn (Builder $pickup): Builder => $pickup->where('pickup_status', 'completed'))
                    ->orWhereHas('deliveryRequest', fn (Builder $delivery): Builder => $delivery->where('delivery_status', 'delivered'));
            });
        } elseif ($scope === 'active') {
            $query
                ->whereRaw('LOWER(order_status) NOT IN (?, ?, ?)', self::HISTORY_STATUSES)
                ->whereDoesntHave('pickupRequest', fn (Builder $pickup): Builder => $pickup->where('pickup_status', 'completed'))
                ->whereDoesntHave('deliveryRequest', fn (Builder $delivery): Builder => $delivery->where('delivery_status', 'delivered'));
        }
    }
}
