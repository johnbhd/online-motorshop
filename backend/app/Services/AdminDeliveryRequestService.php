<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\DeliveryRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class AdminDeliveryRequestService
{
    private const ACTIVE_STATUSES = [
        'waiting_for_booking',
        'booked',
        'picked_up',
        'in_transit',
    ];

    public function __construct(
        private readonly StaffDeliveryRequestPresenter $presenter,
    ) {}

    public function index(array $filters): array
    {
        $deliveries = $this->applyFilters($this->deliveryQuery(), $filters)
            ->with($this->deliveryRelations())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate((int) ($filters['per_page'] ?? 10));

        return [
            'summary' => $this->summary(),
            'delivery_requests' => $deliveries->getCollection()
                ->map(fn (DeliveryRequest $delivery): array => $this->presenter->summary($delivery))
                ->values(),
            'branch_summary' => $this->branchSummary(),
            'filters' => [
                'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
                'staff' => User::query()
                    ->where('role', 'staff')
                    ->orderBy('name')
                    ->get(['id', 'name']),
            ],
            'meta' => [
                'current_page' => $deliveries->currentPage(),
                'last_page' => $deliveries->lastPage(),
                'per_page' => $deliveries->perPage(),
                'total' => $deliveries->total(),
            ],
        ];
    }

    public function find(int $id): ?DeliveryRequest
    {
        return $this->deliveryQuery()
            ->with($this->deliveryRelations())
            ->find($id);
    }

    public function detail(DeliveryRequest $delivery): array
    {
        $delivery->loadMissing($this->deliveryRelations());

        return $this->presenter->details($delivery, []);
    }

    private function deliveryQuery(): Builder
    {
        return DeliveryRequest::query()
            ->whereHas('order', fn (Builder $order): Builder => $order->where('fulfillment_type', 'delivery'));
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
                    ->where('delivery_address', $operator, $term)
                    ->orWhere('booking_reference', $operator, $term)
                    ->orWhere('rider_name', $operator, $term)
                    ->orWhereHas('order', function (Builder $orderQuery) use ($operator, $term): void {
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
        $query->when(! empty($filters['status']), fn (Builder $builder): Builder => $builder->where('delivery_status', $filters['status']));

        return $query;
    }

    private function summary(): array
    {
        $query = $this->deliveryQuery();
        $summary = [
            'total' => (clone $query)->count(),
            'active' => (clone $query)->whereIn('delivery_status', self::ACTIVE_STATUSES)->count(),
            'delivered_today' => (clone $query)
                ->where('delivery_status', 'delivered')
                ->whereDate('delivered_at', today())
                ->count(),
        ];

        foreach (DeliveryRequest::STATUS_VALUES as $status) {
            $summary[$status] = (clone $query)
                ->where('delivery_status', $status)
                ->count();
        }

        return $summary;
    }

    private function branchSummary(): array
    {
        $deliveryRelation = fn (Builder $query): Builder => $query->whereHas(
            'order',
            fn (Builder $orderQuery): Builder => $orderQuery->where('fulfillment_type', 'delivery'),
        );

        return Branch::query()
            ->withCount([
                'deliveryRequests as total_deliveries' => $deliveryRelation,
                'deliveryRequests as active_deliveries' => fn (Builder $query): Builder => $deliveryRelation($query)
                    ->whereIn('delivery_status', self::ACTIVE_STATUSES),
                'deliveryRequests as delivered_deliveries' => fn (Builder $query): Builder => $deliveryRelation($query)
                    ->where('delivery_status', 'delivered'),
            ])
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Branch $branch): array => [
                'id' => $branch->id,
                'name' => $branch->name,
                'total' => $branch->total_deliveries,
                'active' => $branch->active_deliveries,
                'delivered' => $branch->delivered_deliveries,
            ])
            ->all();
    }

    private function deliveryRelations(): array
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
}
