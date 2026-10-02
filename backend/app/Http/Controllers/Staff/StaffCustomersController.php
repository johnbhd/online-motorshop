<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Services\StaffCustomerPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffCustomersController extends Controller
{
    public function __construct(
        private readonly StaffCustomerPresenter $presenter,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'type' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(['registered', 'guest']),
            ],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $branch = $staff->loadMissing('branch:id,name')->branch;
        $branchPayload = $branch?->only(['id', 'name']) ?? [];
        $scopedQuery = $this->scopedQuery($staff->branch_id);
        $customers = $this->applyFilters($scopedQuery, $filters)
            ->with([
                'user:id,email,status,created_at',
            ])
            ->withCount([
                'orderRequests as orders_count' => fn (Builder $query): Builder => $query
                    ->where('branch_id', $staff->branch_id),
                'orderRequests as active_orders_count' => fn (Builder $query): Builder => $query
                    ->where('branch_id', $staff->branch_id)
                    ->whereNotIn('order_status', OrderRequest::TERMINAL_STATUSES),
                'orderRequests as completed_orders_count' => fn (Builder $query): Builder => $query
                    ->where('branch_id', $staff->branch_id)
                    ->where('order_status', 'completed'),
            ])
            ->withMax([
                'orderRequests as last_order_at' => fn (Builder $query): Builder => $query
                    ->where('branch_id', $staff->branch_id),
            ], 'created_at')
            ->selectSub(
                $this->latestOrderIdQuery($staff->branch_id),
                'latest_order_id',
            )
            ->orderByDesc('last_order_at')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 10);
        $latestOrders = $this->latestOrders(
            $customers->getCollection(),
            $staff->branch_id,
        );

        return response()->json([
            'summary' => $this->summary(
                $this->scopedQuery($staff->branch_id),
                $staff->branch_id,
            ),
            'customers' => $customers->getCollection()
                ->map(fn (Customer $customer): array => $this->presenter->summary(
                    $customer,
                    $latestOrders->get((int) $customer->latest_order_id),
                    $branchPayload,
                ))
                ->values(),
            'meta' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ]);
    }

    public function show(Request $request, int $customerId): JsonResponse
    {
        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $branch = $staff->loadMissing('branch:id,name')->branch;
        $branchPayload = $branch?->only(['id', 'name']) ?? [];
        $customer = $this->scopedQuery($staff->branch_id)
            ->whereKey($customerId)
            ->with('user:id,email,status,created_at')
            ->withCount([
                'orderRequests as orders_count' => fn (Builder $query): Builder => $query
                    ->where('branch_id', $staff->branch_id),
                'orderRequests as active_orders_count' => fn (Builder $query): Builder => $query
                    ->where('branch_id', $staff->branch_id)
                    ->whereNotIn('order_status', OrderRequest::TERMINAL_STATUSES),
                'orderRequests as completed_orders_count' => fn (Builder $query): Builder => $query
                    ->where('branch_id', $staff->branch_id)
                    ->where('order_status', 'completed'),
            ])
            ->first();

        if (! $customer) {
            return response()->json([
                'message' => 'Customer not found.',
            ], 404);
        }

        $orders = $this->orderQuery($customer->id, $staff->branch_id)
            ->limit(20)
            ->get();
        $latestOrder = $orders->first();

        return response()->json([
            'customer' => $this->presenter->profile($customer, $branchPayload),
            'summary' => [
                'orders' => (int) $customer->orders_count,
                'active_orders' => (int) $customer->active_orders_count,
                'completed_orders' => (int) $customer->completed_orders_count,
                'last_order' => $latestOrder
                    ? $this->presenter->order($latestOrder)
                    : null,
            ],
            'active_orders' => $orders
                ->filter(fn (OrderRequest $order): bool => ! in_array(
                    $order->order_status,
                    OrderRequest::TERMINAL_STATUSES,
                    true,
                ))
                ->map(fn (OrderRequest $order): array => $this->presenter->order($order))
                ->values(),
            'recent_orders' => $orders
                ->take(5)
                ->map(fn (OrderRequest $order): array => $this->presenter->order($order))
                ->values(),
            'meta' => [
                'returned_orders' => $orders->count(),
                'order_limit' => 20,
            ],
        ]);
    }

    private function scopedQuery(int $branchId): Builder
    {
        return Customer::query()->whereHas(
            'orderRequests',
            fn (Builder $query): Builder => $query->where('branch_id', $branchId),
        );
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search): void {
                $searchQuery
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('contact_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('user', function (Builder $userQuery) use ($search): void {
                        $userQuery->where('email', 'like', "%{$search}%");
                    });
            });
        }

        if (($filters['type'] ?? null) === 'registered') {
            $query->whereNotNull('user_id');
        }

        if (($filters['type'] ?? null) === 'guest') {
            $query->whereNull('user_id');
        }

        return $query;
    }

    private function summary(Builder $query, int $branchId): array
    {
        return [
            'total' => (clone $query)->count(),
            'registered' => (clone $query)->whereNotNull('user_id')->count(),
            'guest' => (clone $query)->whereNull('user_id')->count(),
            'active_orders' => OrderRequest::query()
                ->where('branch_id', $branchId)
                ->whereNotIn('order_status', OrderRequest::TERMINAL_STATUSES)
                ->count(),
        ];
    }

    private function latestOrderIdQuery(int $branchId): Builder
    {
        return OrderRequest::query()
            ->select('id')
            ->whereColumn('customer_id', 'customers.id')
            ->where('branch_id', $branchId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(1);
    }

    /**
     * @param  Collection<int, Customer>  $customers
     * @return Collection<int, OrderRequest>
     */
    private function latestOrders(Collection $customers, int $branchId): Collection
    {
        $orderIds = $customers
            ->pluck('latest_order_id')
            ->filter()
            ->map(fn ($id): int => (int) $id)
            ->values();

        if ($orderIds->isEmpty()) {
            return new Collection;
        }

        return $this->orderQuery(null, $branchId)
            ->whereIn('order_requests.id', $orderIds)
            ->get()
            ->keyBy('id');
    }

    private function orderQuery(?int $customerId, int $branchId): Builder
    {
        return OrderRequest::query()
            ->where('branch_id', $branchId)
            ->when(
                $customerId !== null,
                fn (Builder $query): Builder => $query->where('customer_id', $customerId),
            )
            ->with([
                'branch:id,name',
                'payments:id,order_id,payment_status,created_at',
                'pickupRequest:id,order_id,pickup_status',
                'deliveryRequest:id,order_id,delivery_status',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id');
    }
}
