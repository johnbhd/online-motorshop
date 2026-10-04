<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\OrderRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AdminCustomerService
{
    public function __construct(
        private readonly AdminCustomerPresenter $presenter,
    ) {}

    public function index(array $filters): array
    {
        $query = $this->applyFilters($this->customerQuery(), $filters);
        $customers = $query
            ->with(['user:id,name,email,status,created_at', 'orderRequests.branch:id,name'])
            ->withCount([
                'orderRequests as orders_count' => fn (Builder $order): Builder => $this->branchOrderFilter($order, $filters),
                'orderRequests as active_orders_count' => fn (Builder $order): Builder => $this->branchOrderFilter($order, $filters)
                    ->whereNotIn('order_status', OrderRequest::TERMINAL_STATUSES),
                'orderRequests as completed_orders_count' => fn (Builder $order): Builder => $this->branchOrderFilter($order, $filters)
                    ->where('order_status', 'completed'),
            ])
            ->withMax([
                'orderRequests as last_order_at' => fn (Builder $order): Builder => $this->branchOrderFilter($order, $filters),
            ], 'created_at')
            ->orderByDesc('last_order_at')
            ->orderByDesc('customers.created_at')
            ->orderByDesc('customers.id')
            ->paginate((int) ($filters['per_page'] ?? 10));

        $latestOrders = $this->latestOrders($customers->getCollection(), $filters);

        return [
            'summary' => $this->summary($query, $filters),
            'customers' => $customers->getCollection()
                ->map(fn (Customer $customer): array => $this->presenter->summary(
                    $customer,
                    $latestOrders->get($customer->id),
                ))
                ->values(),
            'meta' => $this->paginationMeta($customers),
        ];
    }

    public function find(Customer $customer): Customer
    {
        return $this->customerQuery()
            ->with('user:id,name,email,status,created_at')
            ->withCount([
                'orderRequests as orders_count',
                'orderRequests as active_orders_count' => fn (Builder $query): Builder => $query
                    ->whereNotIn('order_status', OrderRequest::TERMINAL_STATUSES),
                'orderRequests as completed_orders_count' => fn (Builder $query): Builder => $query
                    ->where('order_status', 'completed'),
            ])
            ->findOrFail($customer->getKey());
    }

    public function details(Customer $customer, int $perPage = 10): array
    {
        $customer = $this->find($customer);
        $orders = $customer->orderRequests()
            ->with([
                'branch:id,name',
                'payments:id,order_id,payment_status,created_at',
                'pickupRequest:id,order_id,pickup_status',
                'deliveryRequest:id,order_id,delivery_status',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);

        $orderPayload = $orders->getCollection()
            ->map(fn (OrderRequest $order): array => $this->presenter->order($order))
            ->values()
            ->all();

        $branchOrders = $customer->orderRequests()
            ->with('branch:id,name')
            ->get();
        $customer->setRelation('orderRequests', $branchOrders);

        return [
            'customer' => $this->presenter->detail(
                $customer,
                $orderPayload,
                $this->presenter->branchActivity($customer),
            ),
            'meta' => $this->paginationMeta($orders),
        ];
    }

    public function update(Customer $customer, array $attributes): Customer
    {
        $customer = $this->find($customer);
        $user = $customer->user;

        if ($user === null && array_key_exists('status', $attributes)) {
            abort(response()->json([
                'message' => 'Guest customers do not have an account status.',
                'errors' => ['status' => ['Guest customers do not have an account status.']],
            ], 422));
        }

        return DB::transaction(function () use ($customer, $user, $attributes): Customer {
            $customerValues = array_intersect_key($attributes, array_flip([
                'full_name',
                'contact_number',
                'address',
            ]));

            if (array_key_exists('email', $attributes)) {
                $customerValues['email'] = $attributes['email'];
            }

            $customer->fill($customerValues)->save();

            if ($user !== null) {
                $userValues = array_intersect_key($attributes, array_flip(['email', 'status']));

                if (array_key_exists('full_name', $attributes)) {
                    $userValues['name'] = $attributes['full_name'];
                }

                $wasActive = $user->status === 'active';
                $user->fill($userValues)->save();

                if ($wasActive && $user->status !== 'active') {
                    $user->tokens()->delete();
                }
            }

            return $this->find($customer);
        });
    }

    public function delete(Customer $customer): bool
    {
        $customer = $this->find($customer);

        if ($customer->user_id !== null) {
            abort(response()->json([
                'message' => 'Registered customer accounts cannot be hard-deleted; deactivate the account instead.',
            ], 409));
        }

        if ($customer->orderRequests()->exists() || $customer->conversations()->exists()) {
            abort(response()->json([
                'message' => 'This guest customer cannot be deleted because operational or historical records reference it.',
            ], 409));
        }

        return (bool) $customer->delete();
    }

    private function customerQuery(): Builder
    {
        return Customer::query();
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        $operator = $query->getModel()->getConnection()->getDriverName() === 'pgsql'
            ? 'ilike'
            : 'like';
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $term = "%{$search}%";
            $query->where(function (Builder $searchQuery) use ($operator, $term): void {
                $searchQuery
                    ->where('full_name', $operator, $term)
                    ->orWhere('contact_number', $operator, $term)
                    ->orWhere('email', $operator, $term)
                    ->orWhereHas('user', fn (Builder $user): Builder => $user
                        ->where('name', $operator, $term)
                        ->orWhere('email', $operator, $term));
            });
        }

        if (($filters['type'] ?? null) === 'registered') {
            $query->whereNotNull('user_id');
        }

        if (($filters['type'] ?? null) === 'guest') {
            $query->whereNull('user_id');
        }

        if (($filters['status'] ?? null) !== null && ($filters['status'] ?? '') !== '') {
            $query->whereHas('user', fn (Builder $user): Builder => $user->where('status', $filters['status']));
        }

        if (($filters['branch_id'] ?? null) !== null && ($filters['branch_id'] ?? '') !== '') {
            $query->whereHas('orderRequests', fn (Builder $order): Builder => $order->where('branch_id', $filters['branch_id']));
        }

        return $query;
    }

    private function branchOrderFilter(Builder $query, array $filters): Builder
    {
        if (($filters['branch_id'] ?? null) !== null && ($filters['branch_id'] ?? '') !== '') {
            $query->where('branch_id', $filters['branch_id']);
        }

        return $query;
    }

    private function summary(Builder $query, array $filters): array
    {
        $active = (clone $query)->whereHas('orderRequests', function (Builder $order) use ($filters): void {
            $this->branchOrderFilter($order, $filters)
                ->whereNotIn('order_status', OrderRequest::TERMINAL_STATUSES);
        });

        return [
            'total' => (clone $query)->count(),
            'registered' => (clone $query)->whereNotNull('user_id')->count(),
            'guest' => (clone $query)->whereNull('user_id')->count(),
            'customers_with_active_orders' => $active->count(),
        ];
    }

    private function latestOrders($customers, array $filters)
    {
        $ids = $customers->pluck('id');

        if ($ids->isEmpty()) {
            return collect();
        }

        $orders = OrderRequest::query()
            ->whereIn('customer_id', $ids)
            ->with([
                'branch:id,name',
                'payments:id,order_id,payment_status,created_at',
                'pickupRequest:id,order_id,pickup_status',
                'deliveryRequest:id,order_id,delivery_status',
            ])
            ->when(
                ($filters['branch_id'] ?? null) !== null && ($filters['branch_id'] ?? '') !== '',
                fn (Builder $query): Builder => $query->where('branch_id', $filters['branch_id']),
            )
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return $orders->groupBy('customer_id')->map(fn ($items) => $items->first());
    }

    private function paginationMeta($paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }
}
