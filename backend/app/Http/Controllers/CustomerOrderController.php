<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\OrderRequest;
use App\Services\OrderRequestPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerOrderController extends Controller
{
    private const HISTORY_STATUSES = [
        'completed',
        'rejected',
        'cancelled',
    ];

    public function __construct(
        private readonly OrderRequestPresenter $orderRequestPresenter,
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
                'payments:id,order_id,payment_method,amount,payment_reference,payment_status,created_at,verified_at',
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
                'items.product:id,part_number',
                'payments:id,order_id,payment_method,amount,payment_reference,payment_status,created_at,verified_at',
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

    private function ownedOrderQuery(Customer $customer, string $reference): Builder
    {
        return OrderRequest::query()
            ->where('customer_id', $customer->id)
            ->whereRaw('LOWER(order_reference) = ?', [strtolower(trim($reference))]);
    }

    private function applyScope(Builder $query, ?string $scope): void
    {
        if ($scope === 'history') {
            $query->whereRaw(
                'LOWER(order_status) IN (?, ?, ?)',
                self::HISTORY_STATUSES,
            );
        } elseif ($scope === 'active') {
            $query->whereRaw(
                'LOWER(order_status) NOT IN (?, ?, ?)',
                self::HISTORY_STATUSES,
            );
        }
    }
}
