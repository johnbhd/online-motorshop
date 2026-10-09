<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\PickupRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class AdminPickupRequestService
{
    public function __construct(
        private readonly StaffPickupRequestPresenter $presenter,
    ) {}

    public function index(array $filters): array
    {
        $pickups = $this->applyFilters($this->pickupQuery(), $filters)
            ->with($this->pickupRelations())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate((int) ($filters['per_page'] ?? 10));

        return [
            'summary' => $this->summary(),
            'pickup_requests' => $pickups->getCollection()
                ->map(fn (PickupRequest $pickupRequest): array => $this->presenter->summary($pickupRequest))
                ->values(),
            'branch_summary' => $this->branchSummary(),
            'filters' => [
                'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
                'staff' => User::query()
                    ->where('role', 'staff')
                    ->orderBy('name')
                    ->get(['id', 'name']),
            ],
            'meta' => $this->paginationMeta($pickups),
        ];
    }

    public function find(int $id): ?PickupRequest
    {
        return $this->pickupQuery()
            ->with($this->pickupRelations())
            ->find($id);
    }

    public function detail(PickupRequest $pickupRequest): array
    {
        $pickupRequest->loadMissing($this->pickupRelations());

        return $this->presenter->details($pickupRequest, []);
    }

    private function pickupQuery(): Builder
    {
        return PickupRequest::query()
            ->whereHas('order', fn (Builder $orderQuery): Builder => $orderQuery->where('fulfillment_type', 'pickup'));
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
                    ->whereHas('order', function (Builder $orderQuery) use ($operator, $term): void {
                        $orderQuery
                            ->where('order_reference', $operator, $term)
                            ->orWhereHas('customer', function (Builder $customerQuery) use ($operator, $term): void {
                                $customerQuery
                                    ->where('full_name', $operator, $term)
                                    ->orWhere('contact_number', $operator, $term)
                                    ->orWhere('email', $operator, $term);
                            });
                    })
                    ->orWhereHas('branch', fn (Builder $branchQuery): Builder => $branchQuery->where('name', $operator, $term))
                    ->orWhereHas('assignedStaff', fn (Builder $staffQuery): Builder => $staffQuery->where('name', $operator, $term));
            });
        }

        $query->when(! empty($filters['branch_id']), fn (Builder $builder): Builder => $builder->where('branch_id', $filters['branch_id']));
        $query->when(! empty($filters['assigned_staff_id']), fn (Builder $builder): Builder => $builder->where('assigned_staff_id', $filters['assigned_staff_id']));
        $query->when(! empty($filters['status']), fn (Builder $builder): Builder => $builder->where('pickup_status', $filters['status']));

        return $query;
    }

    private function summary(): array
    {
        $query = $this->pickupQuery();
        $summary = ['total' => (clone $query)->count()];

        foreach (PickupRequest::STATUS_VALUES as $status) {
            $summary[$status] = (clone $query)
                ->where('pickup_status', $status)
                ->count();
        }

        $summary['active'] = (clone $query)
            ->whereIn('pickup_status', ['pending', 'preparing', 'ready_for_pickup'])
            ->count();
        $summary['completed_today'] = (clone $query)
            ->where('pickup_status', 'completed')
            ->whereDate('completed_at', today())
            ->count();

        return $summary;
    }

    private function branchSummary(): array
    {
        $activeStatuses = ['pending', 'preparing', 'ready_for_pickup'];
        $pickupRelation = fn (Builder $query): Builder => $query->whereHas(
            'order',
            fn (Builder $orderQuery): Builder => $orderQuery->where('fulfillment_type', 'pickup'),
        );

        return Branch::query()
            ->withCount([
                'pickupRequests as total_pickups' => $pickupRelation,
                'pickupRequests as active_pickups' => fn (Builder $query): Builder => $pickupRelation($query)
                    ->whereIn('pickup_status', $activeStatuses),
                'pickupRequests as completed_pickups' => fn (Builder $query): Builder => $pickupRelation($query)
                    ->where('pickup_status', 'completed'),
            ])
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Branch $branch): array => [
                'id' => $branch->id,
                'name' => $branch->name,
                'total' => $branch->total_pickups,
                'active' => $branch->active_pickups,
                'completed' => $branch->completed_pickups,
            ])
            ->all();
    }

    private function pickupRelations(): array
    {
        return [
            'order:id,order_reference,customer_id,branch_id,fulfillment_type,order_status,subtotal,delivery_fee,total_amount,created_at,updated_at',
            'order.customer:id,full_name,contact_number,email,address,user_id',
            'order.items:id,order_id,product_id,product_name,unit_price,quantity,subtotal',
            'order.items.product:id,part_number',
            'order.payments:id,order_id,payment_method,amount,payment_reference,payment_status,verified_at,created_at',
            'branch:id,name,address,contact_number',
            'assignedStaff:id,name',
        ];
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
