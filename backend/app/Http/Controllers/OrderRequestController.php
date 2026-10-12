<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequestRequest;
use App\Http\Requests\TrackOrderRequest;
use App\Models\OrderRequest;
use App\Services\DeliveryRouteService;
use App\Services\LocationMismatchException;
use App\Services\OrderRequestCreator;
use App\Services\OrderRequestPresenter;
use App\Services\PsgcLocationDataUnavailable;
use App\Services\PsgcLocationSelectionException;
use App\Services\StaffAdminNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class OrderRequestController extends Controller
{
    public function __construct(
        private readonly OrderRequestCreator $orderRequestCreator,
        private readonly DeliveryRouteService $deliveryRouteService,
        private readonly OrderRequestPresenter $orderRequestPresenter,
        private readonly StaffAdminNotificationService $staffAdminNotificationService,
    ) {}

    public function store(StoreOrderRequestRequest $request): JsonResponse
    {
        $authorizationHeader = trim((string) $request->header('Authorization'));
        $user = Auth::guard('sanctum')->user();

        if ($authorizationHeader !== '' && ! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($user && $user->role !== 'customer') {
            return response()->json([
                'message' => 'Only customer accounts may submit orders.',
            ], 403);
        }

        try {
            $order = $this->orderRequestCreator->create($request->validated(), $user);
        } catch (LocationMismatchException $exception) {
            $errors = [];

            foreach ($exception->errors() as $key => $messages) {
                $errors[str_starts_with($key, 'fulfillment.') ? $key : 'fulfillment.delivery.'.$key] = $messages;
            }

            return response()->json([
                'message' => $exception->getMessage(),
                'errors' => $errors,
            ], 422);
        } catch (PsgcLocationSelectionException $exception) {
            $errors = [];

            foreach ($exception->errors() as $key => $messages) {
                $errors['fulfillment.delivery.'.$key] = $messages;
            }

            return response()->json([
                'message' => 'The delivery location could not be verified.',
                'errors' => $errors,
            ], 422);
        } catch (PsgcLocationDataUnavailable $exception) {
            return response()->json([
                'message' => 'Location data is currently unavailable.',
            ], 503);
        }
        $this->staffAdminNotificationService->orderCreated($order);

        return response()->json([
            'message' => 'Order request submitted successfully.',
            'order' => $this->orderRequestPresenter->confirmation($order),
        ], 201);
    }

    public function track(TrackOrderRequest $request): JsonResponse
    {
        $data = $request->validated();
        $order = OrderRequest::query()
            ->whereRaw('LOWER(order_reference) = ?', [strtolower($data['order_reference'])])
            ->with([
                'branch',
                'items.product:id,part_number,img_url',
                'customer',
                'payments:id,order_id,payment_method,amount,payment_reference,proof_image_url,payment_status,created_at,verified_at',
                'pickupRequest.branch',
                'deliveryRequest.branch',
            ])
            ->first();

        if (! $order || ! $this->contactsMatch($order->customer?->contact_number, $data['contact_number'])) {
            return response()->json([
                'message' => 'Order not found or verification information is incorrect.',
            ], 404);
        }

        if ($order->fulfillment_type === 'delivery' && $order->deliveryRequest) {
            $this->deliveryRouteService->generateFor($order->deliveryRequest);
        }

        return response()->json([
            'order' => $this->orderRequestPresenter->detail($order, includeCustomer: false),
        ]);
    }

    private function contactsMatch(?string $storedContact, string $providedContact): bool
    {
        if ($storedContact === null) {
            return false;
        }

        return $this->normalizeContact($storedContact) === $this->normalizeContact($providedContact);
    }

    private function normalizeContact(string $contact): string
    {
        return preg_replace('/\D+/', '', trim($contact)) ?? '';
    }
}
