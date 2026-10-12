<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class AdminPaymentService
{
    public function __construct(
        private readonly StaffPaymentPresenter $presenter,
        private readonly StaffPaymentStatusService $statusService,
        private readonly AdminArchiveService $archiveService,
    ) {}

    public function index(array $filters): array
    {
        $payments = $this->applyFilters($this->paymentQuery(), $filters)
            ->with($this->paymentRelations())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate((int) ($filters['per_page'] ?? 10));

        return [
            'summary' => $this->summary($this->paymentQuery()),
            'payments' => $payments->getCollection()
                ->map(fn (Payment $payment): array => $this->presenter->summary($payment))
                ->values(),
            'filters' => [
                'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
                'methods' => Payment::METHOD_VALUES,
                'statuses' => Payment::STATUS_VALUES,
            ],
            'meta' => $this->paginationMeta($payments),
        ];
    }

    public function find(int $id): ?Payment
    {
        return $this->paymentQuery()
            ->with($this->paymentRelations())
            ->find($id);
    }

    public function detail(Payment $payment): array
    {
        $payment->loadMissing($this->paymentRelations());

        return $this->presenter->details(
            $payment,
            $this->statusService->allowedStatuses($payment),
        );
    }

    public function transition(Payment $payment, string $status, User $admin): Payment
    {
        $payment = $this->statusService->transition($payment, $status, $admin);

        return $this->find($payment->id) ?? $payment;
    }

    private function paymentQuery(): Builder
    {
        return $this->archiveService->excludeArchived(Payment::query(), 'payment');
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
                    ->where('payment_reference', $operator, $term)
                    ->orWhereHas('order', function (Builder $orderQuery) use ($operator, $term): void {
                        $orderQuery
                            ->where('order_reference', $operator, $term)
                            ->orWhereHas('customer', function (Builder $customerQuery) use ($operator, $term): void {
                                $customerQuery
                                    ->where('full_name', $operator, $term)
                                    ->orWhere('contact_number', $operator, $term)
                                    ->orWhere('email', $operator, $term);
                            });
                    });
            });
        }

        $query->when(! empty($filters['branch_id']), fn (Builder $builder): Builder => $builder->whereHas(
            'order',
            fn (Builder $orderQuery): Builder => $orderQuery->where('branch_id', $filters['branch_id']),
        ));
        $query->when(! empty($filters['method']), fn (Builder $builder): Builder => $builder->where('payment_method', $filters['method']));
        $query->when(! empty($filters['status']), fn (Builder $builder): Builder => $builder->where('payment_status', $filters['status']));
        $query->when(! empty($filters['fulfillment']), fn (Builder $builder): Builder => $builder->whereHas(
            'order',
            fn (Builder $orderQuery): Builder => $orderQuery->where('fulfillment_type', $filters['fulfillment']),
        ));

        return $query;
    }

    private function summary(Builder $query): array
    {
        $summary = ['total' => (clone $query)->count()];

        foreach (Payment::STATUS_VALUES as $status) {
            $summary[$status] = (clone $query)
                ->where('payment_status', $status)
                ->count();
        }

        return $summary;
    }

    private function paymentRelations(): array
    {
        return [
            'order:id,order_reference,customer_id,branch_id,fulfillment_type,order_status,subtotal,delivery_fee,total_amount',
            'order.customer:id,full_name,contact_number,email',
            'order.branch:id,name,address,contact_number',
            'order.items:id,order_id,product_id,product_name,unit_price,quantity,subtotal',
            'verifiedBy:id,name',
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
