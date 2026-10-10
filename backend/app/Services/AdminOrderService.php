<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class AdminOrderService
{
    public function __construct(
        private readonly OrderRequestPresenter $presenter,
        private readonly StaffOrderStatusService $statusService,
        private readonly StaffAdminNotificationService $staffAdminNotificationService,
    ) {}

    public function index(array $filters): array
    {
        $orders = $this->applyFilters($this->orderQuery(), $filters)
            ->with($this->summaryRelations())
            ->withCount('items')
            ->withSum('items', 'quantity')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate((int) ($filters['per_page'] ?? 10));

        return [
            'summary' => $this->summary($this->orderQuery()),
            'orders' => $orders->getCollection()
                ->map(fn (OrderRequest $order): array => $this->presenter->adminSummary($order))
                ->values(),
            'filters' => [
                'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
                'staff' => User::query()
                    ->where('role', 'staff')
                    ->where('status', 'active')
                    ->orderBy('name')
                    ->get(['id', 'name', 'branch_id']),
            ],
            'meta' => $this->paginationMeta($orders),
        ];
    }

    public function find(string $reference): ?OrderRequest
    {
        return $this->orderQuery()
            ->with($this->detailRelations())
            ->whereRaw('LOWER(order_reference) = ?', [strtolower(trim($reference))])
            ->first();
    }

    public function detail(OrderRequest $order): array
    {
        $order->loadMissing($this->detailRelations());

        return $this->presenter->adminDetail(
            $order,
            $this->statusService->allowedStatuses($order),
        );
    }

    public function transition(OrderRequest $order, string $status): OrderRequest
    {
        $order = $this->statusService->transition($order, $status);

        return $this->find($order->order_reference) ?? $order;
    }

    public function assign(OrderRequest $order, ?int $staffId): OrderRequest
    {
        $staff = $staffId === null ? null : User::query()->find($staffId);

        if ($staff !== null && (
            $staff->role !== 'staff'
            || $staff->status !== 'active'
            || $staff->branch_id !== $order->branch_id
        )) {
            throw ValidationException::withMessages([
                'staff_id' => ['Staff must be active and assigned to the order branch.'],
            ]);
        }

        $order->update(['assigned_staff_id' => $staff?->id]);

        $this->staffAdminNotificationService->orderAssigned($order, $staff?->id);

        return $this->find($order->order_reference) ?? $order;
    }

    public function assignableStaff(OrderRequest $order): array
    {
        return User::query()
            ->where('role', 'staff')
            ->where('status', 'active')
            ->where('branch_id', $order->branch_id)
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'branch_id'])
            ->values()
            ->all();
    }

    private function orderQuery(): Builder
    {
        return OrderRequest::query();
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
                    ->where('order_reference', $operator, $term)
                    ->orWhereHas('customer', function (Builder $customerQuery) use ($operator, $term): void {
                        $customerQuery
                            ->where('full_name', $operator, $term)
                            ->orWhere('contact_number', $operator, $term)
                            ->orWhere('email', $operator, $term);
                    });
            });
        }

        $query->when(! empty($filters['branch_id']), fn (Builder $builder): Builder => $builder->where('branch_id', $filters['branch_id']));
        $query->when(! empty($filters['status']), fn (Builder $builder): Builder => $builder->where('order_status', $filters['status']));
        $query->when(! empty($filters['fulfillment']), fn (Builder $builder): Builder => $builder->where('fulfillment_type', $filters['fulfillment']));
        $query->when(
            array_key_exists('assigned_staff_id', $filters) && $filters['assigned_staff_id'] !== null,
            fn (Builder $builder): Builder => $builder->where('assigned_staff_id', $filters['assigned_staff_id']),
        );

        if (($filters['payment_status'] ?? null) !== null && ($filters['payment_status'] ?? '') !== '') {
            if ($filters['payment_status'] === Payment::STATUS_UNPAID) {
                $query->where(function (Builder $builder): void {
                    $builder->whereDoesntHave('payments')
                        ->orWhereHas('payments', fn (Builder $payment): Builder => $payment->where('payment_status', Payment::STATUS_UNPAID));
                });
            } else {
                $query->whereHas('payments', fn (Builder $payment): Builder => $payment->where('payment_status', $filters['payment_status']));
            }
        }

        return $query;
    }

    private function summary(Builder $query): array
    {
        return [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('order_status', 'pending')->count(),
            'under_review' => (clone $query)->where('order_status', 'under_review')->count(),
            'confirmed' => (clone $query)->where('order_status', 'confirmed')->count(),
            'completed' => (clone $query)->where('order_status', 'completed')->count(),
            'needs_review' => (clone $query)->whereIn('order_status', ['pending', 'under_review'])->count(),
            'status_counts' => collect(OrderRequest::STAFF_STATUS_VALUES)
                ->mapWithKeys(fn (string $status): array => [
                    $status => (clone $query)->where('order_status', $status)->count(),
                ])
                ->all(),
        ];
    }

    private function summaryRelations(): array
    {
        return [
            'customer:id,full_name,contact_number,email',
            'branch:id,name,address,contact_number',
            'assignedStaff:id,name,email,branch_id',
            'payments:id,order_id,payment_method,amount,payment_reference,payment_status,created_at,verified_at',
            'pickupRequest:id,order_id,branch_id,pickup_status',
            'deliveryRequest:id,order_id,branch_id,delivery_status',
        ];
    }

    private function detailRelations(): array
    {
        return [
            'customer:id,full_name,contact_number,email,address,user_id',
            'branch:id,name,address,contact_number',
            'assignedStaff:id,name,email,branch_id',
            'items.product:id,part_number,img_url',
            'payments:id,order_id,payment_method,amount,payment_reference,proof_image_url,payment_status,created_at,verified_at',
            'pickupRequest.branch',
            'deliveryRequest.branch',
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
