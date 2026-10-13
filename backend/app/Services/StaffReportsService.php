<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\OrderItem;
use App\Models\OrderRequest;
use App\Models\Payment;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class StaffReportsService
{
    private const STATUS_COLORS = [
        'pending' => '#f97316',
        'under_review' => '#f59e0b',
        'confirmed' => '#0B1930',
        'waiting_for_payment' => '#64748b',
        'payment_verification' => '#8b5cf6',
        'preparing_order' => '#3b82f6',
        'ready_for_pickup' => '#10b981',
        'booked_for_delivery' => '#6366f1',
        'picked_up_by_rider' => '#14b8a6',
        'waiting_for_booking' => '#a855f7',
        'completed' => '#16a34a',
        'rejected' => '#dc2626',
        'cancelled' => '#94a3b8',
    ];

    public function __construct(
        private readonly OrderRequestPresenter $orderRequestPresenter,
    ) {}

    public function report(array $filters, Branch $branch): array
    {
        [$from, $to] = $this->dateRange($filters);
        $orders = $this->orderScope($branch->id, $from, $to, $filters);
        $successfulOrders = $this->successfulOrderScope($orders);
        $payments = $this->paymentScope($orders, $filters['payment_status'] ?? null);
        $collectedPayments = $this->collectedPaymentScope($successfulOrders);
        $ordersPage = (clone $orders)
            ->with([
                'customer:id,full_name,contact_number,email',
                'branch:id,name,address,contact_number',
                'payments:id,order_id,payment_method,amount,payment_reference,payment_status,created_at,verified_at',
            ])
            ->withCount('items')
            ->withSum('items', 'quantity')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate((int) ($filters['per_page'] ?? 10));

        return [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'fulfillment' => $filters['fulfillment'] ?? null,
                'order_status' => $filters['order_status'] ?? null,
                'payment_status' => $filters['payment_status'] ?? null,
                'branch' => [
                    'id' => $branch->id,
                    'name' => $branch->name,
                ],
            ],
            'summary' => $this->summary($orders, $successfulOrders, $payments, $collectedPayments),
            'order_trend' => $this->trend(
                $this->dailyCounts($orders),
                $this->dailySums($collectedPayments),
                $from,
                $to,
                $this->granularity($from, $to),
            ),
            'order_statuses' => $this->orderStatuses($orders),
            'fulfillment' => $this->fulfillment($orders, $successfulOrders),
            'payments' => $this->paymentAnalytics($payments),
            'customers' => $this->customerAnalytics($orders),
            'top_products' => $this->topProducts($successfulOrders),
            'orders' => $ordersPage->getCollection()
                ->map(fn (OrderRequest $order): array => $this->orderRequestPresenter->staffSummary($order))
                ->values()
                ->all(),
            'meta' => [
                'current_page' => $ordersPage->currentPage(),
                'last_page' => $ordersPage->lastPage(),
                'per_page' => $ordersPage->perPage(),
                'total' => $ordersPage->total(),
            ],
            'recent_completed_orders' => $this->recentCompletedOrders($successfulOrders),
        ];
    }

    private function summary(
        Builder $orders,
        Builder $successfulOrders,
        Builder $payments,
        Builder $collectedPayments,
    ): array {
        return [
            'order_requests' => (clone $orders)->count(),
            'completed_orders' => (clone $successfulOrders)->count(),
            'in_progress_orders' => (clone $orders)
                ->whereNotIn('order_status', OrderRequest::TERMINAL_STATUSES)
                ->count(),
            'cancelled_or_rejected_orders' => (clone $orders)
                ->whereIn('order_status', ['cancelled', 'rejected'])
                ->count(),
            'completed_sales_value' => round((float) (clone $collectedPayments)->sum('amount'), 2),
            'verified_payments' => (clone $payments)
                ->where('payment_status', Payment::STATUS_PAID)
                ->count(),
            'payment_attention' => (clone $payments)
                ->whereIn('payment_status', [
                    Payment::STATUS_UNPAID,
                    'waiting_for_payment',
                    Payment::STATUS_WAITING_FOR_VERIFICATION,
                ])
                ->count(),
            'pickup_orders' => (clone $orders)->where('fulfillment_type', 'pickup')->count(),
            'delivery_orders' => (clone $orders)->where('fulfillment_type', 'delivery')->count(),
        ];
    }

    private function orderStatuses(Builder $orders): array
    {
        $counts = (clone $orders)
            ->selectRaw('order_status, COUNT(*) as total')
            ->groupBy('order_status')
            ->pluck('total', 'order_status');

        return collect(OrderRequest::STAFF_STATUS_VALUES)
            ->map(fn (string $status): array => [
                'key' => $status,
                'label' => $this->label($status),
                'value' => (int) ($counts[$status] ?? 0),
                'color' => self::STATUS_COLORS[$status] ?? '#64748b',
            ])
            ->values()
            ->all();
    }

    private function fulfillment(Builder $orders, Builder $successfulOrders): array
    {
        $total = (clone $orders)->count();
        $totals = (clone $orders)
            ->selectRaw('fulfillment_type, COUNT(*) as total')
            ->groupBy('fulfillment_type')
            ->pluck('total', 'fulfillment_type');
        $successful = (clone $successfulOrders)
            ->selectRaw('fulfillment_type, COUNT(*) as total')
            ->groupBy('fulfillment_type')
            ->pluck('total', 'fulfillment_type');

        return collect(['pickup', 'delivery'])
            ->map(fn (string $method): array => [
                'key' => $method,
                'label' => $method === 'delivery' ? 'Lalamove Delivery' : 'Store Pickup',
                'orders' => (int) ($totals[$method] ?? 0),
                'completed_orders' => (int) ($successful[$method] ?? 0),
                'percentage' => $total > 0
                    ? round(((int) ($totals[$method] ?? 0) / $total) * 100, 1)
                    : 0,
            ])
            ->values()
            ->all();
    }

    private function paymentAnalytics(Builder $payments): array
    {
        $methods = (clone $payments)
            ->selectRaw('payment_method, COUNT(*) as total')
            ->groupBy('payment_method')
            ->pluck('total', 'payment_method');
        $statuses = (clone $payments)
            ->selectRaw('payment_status, COUNT(*) as total')
            ->groupBy('payment_status')
            ->pluck('total', 'payment_status');

        return [
            'methods' => collect(Payment::METHOD_VALUES)
                ->map(fn (string $method): array => [
                    'key' => $method,
                    'label' => $method === Payment::METHOD_ONLINE_PAYMENT
                        ? 'Online Payment'
                        : 'Pay at Pickup',
                    'value' => (int) ($methods[$method] ?? 0),
                ])
                ->values()
                ->all(),
            'statuses' => collect(Payment::STATUS_VALUES)
                ->map(fn (string $status): array => [
                    'key' => $status,
                    'label' => $this->label($status),
                    'value' => (int) ($statuses[$status] ?? 0),
                ])
                ->values()
                ->all(),
            'verified_amount' => round((float) (clone $payments)
                ->where('payment_status', Payment::STATUS_PAID)
                ->sum('amount'), 2),
        ];
    }

    private function customerAnalytics(Builder $orders): array
    {
        $customerIds = (clone $orders)
            ->whereNotNull('customer_id')
            ->select('customer_id')
            ->distinct();
        $repeatCustomers = (clone $orders)
            ->whereNotNull('customer_id')
            ->select('customer_id')
            ->groupBy('customer_id')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();

        return [
            'total' => (clone $orders)
                ->whereNotNull('customer_id')
                ->distinct()
                ->count('customer_id'),
            'registered' => Customer::query()
                ->whereIn('id', $customerIds)
                ->whereNotNull('user_id')
                ->count(),
            'guests' => Customer::query()
                ->whereIn('id', $customerIds)
                ->whereNull('user_id')
                ->count(),
            'repeat_customers' => $repeatCustomers,
        ];
    }

    private function topProducts(Builder $successfulOrders): array
    {
        return $this->successfulItemQuery($successfulOrders)
            ->selectRaw('order_items.product_id, order_items.product_name, products.part_number, SUM(order_items.quantity) as units_sold, COUNT(DISTINCT order_items.order_id) as orders, SUM(order_items.subtotal) as revenue')
            ->groupBy('order_items.product_id', 'order_items.product_name', 'products.part_number')
            ->orderByDesc('units_sold')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(fn ($row): array => [
                'product_id' => $row->product_id,
                'name' => $row->product_name,
                'part_number' => $row->part_number,
                'units_sold' => (int) $row->units_sold,
                'orders' => (int) $row->orders,
                'revenue' => round((float) $row->revenue, 2),
            ])
            ->values()
            ->all();
    }

    private function recentCompletedOrders(Builder $successfulOrders): array
    {
        return (clone $successfulOrders)
            ->with('branch:id,name')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(5)
            ->get(['id', 'order_reference', 'branch_id', 'fulfillment_type', 'total_amount', 'created_at'])
            ->map(fn (OrderRequest $order): array => [
                'reference' => $order->order_reference,
                'fulfillment' => $order->fulfillment_type,
                'total_amount' => (float) $order->total_amount,
                'created_at' => $order->created_at?->toISOString(),
            ])
            ->values()
            ->all();
    }

    private function dailyCounts(Builder $orders): Collection
    {
        return (clone $orders)
            ->selectRaw('DATE(created_at) as bucket, COUNT(*) as total')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('bucket')
            ->get();
    }

    private function dailySums(Builder $payments): Collection
    {
        return (clone $payments)
            ->selectRaw('DATE(created_at) as bucket, SUM(amount) as total')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('bucket')
            ->get();
    }

    private function trend(
        Collection $orders,
        Collection $revenue,
        CarbonImmutable $from,
        CarbonImmutable $to,
        string $granularity,
    ): array {
        $orderBuckets = $orders->groupBy(
            fn ($row): string => $this->periodKey(
                CarbonImmutable::parse((string) $row->bucket, 'UTC'),
                $granularity,
            ),
        );
        $revenueBuckets = $revenue->groupBy(
            fn ($row): string => $this->periodKey(
                CarbonImmutable::parse((string) $row->bucket, 'UTC'),
                $granularity,
            ),
        );
        $series = [];
        $cursor = $this->periodStart($from, $granularity);
        $last = $this->periodStart($to, $granularity);

        while ($cursor->lessThanOrEqualTo($last)) {
            $key = $cursor->toDateString();
            $series[] = [
                'key' => $key,
                'label' => $this->periodLabel($cursor, $granularity),
                'orders' => (int) $orderBuckets->get($key, collect())->sum('total'),
                'completed_sales' => round(
                    (float) $revenueBuckets->get($key, collect())->sum('total'),
                    2,
                ),
            ];
            $cursor = match ($granularity) {
                'week' => $cursor->addWeek(),
                'month' => $cursor->addMonth(),
                default => $cursor->addDay(),
            };
        }

        return $series;
    }

    private function successfulItemQuery(Builder $successfulOrders): Builder
    {
        return OrderItem::query()
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->whereIn('order_items.order_id', (clone $successfulOrders)->select('id'));
    }

    private function orderScope(
        int $branchId,
        CarbonImmutable $from,
        CarbonImmutable $to,
        array $filters,
    ): Builder {
        return OrderRequest::query()
            ->where('branch_id', $branchId)
            ->whereBetween('created_at', [$from, $to])
            ->when(
                ! empty($filters['fulfillment']),
                fn (Builder $query): Builder => $query->where(
                    'fulfillment_type',
                    $filters['fulfillment'],
                ),
            )
            ->when(
                ! empty($filters['order_status']),
                fn (Builder $query): Builder => $query->where(
                    'order_status',
                    $filters['order_status'],
                ),
            )
            ->when(
                ! empty($filters['payment_status']),
                fn (Builder $query): Builder => $query->whereHas(
                    'payments',
                    fn (Builder $paymentQuery): Builder => $paymentQuery
                        ->latestPerOrder()
                        ->where('payment_status', $filters['payment_status']),
                ),
            );
    }

    private function successfulOrderScope(Builder $orders): Builder
    {
        return (clone $orders)->successfulFulfillment();
    }

    private function paymentScope(Builder $orders, ?string $paymentStatus): Builder
    {
        return Payment::query()
            ->latestPerOrder()
            ->whereIn('order_id', (clone $orders)->select('id'))
            ->when(
                $paymentStatus !== null && $paymentStatus !== '',
                fn (Builder $query): Builder => $query->where(
                    'payment_status',
                    $paymentStatus,
                ),
            );
    }

    private function collectedPaymentScope(Builder $successfulOrders): Builder
    {
        return $this->paymentScope($successfulOrders, Payment::STATUS_PAID);
    }

    /** @return array{0: CarbonImmutable, 1: CarbonImmutable} */
    private function dateRange(array $filters): array
    {
        $today = CarbonImmutable::now('UTC')->startOfDay();
        $from = CarbonImmutable::parse(
            $filters['from'] ?? $today->subDays(29)->toDateString(),
            'UTC',
        )->startOfDay();
        $to = CarbonImmutable::parse(
            $filters['to'] ?? $today->toDateString(),
            'UTC',
        )->endOfDay();

        return [$from, $to];
    }

    private function granularity(CarbonImmutable $from, CarbonImmutable $to): string
    {
        $days = $from->startOfDay()->diffInDays($to->startOfDay());

        return $days <= 62 ? 'day' : ($days <= 366 ? 'week' : 'month');
    }

    private function periodStart(CarbonImmutable $date, string $granularity): CarbonImmutable
    {
        return match ($granularity) {
            'week' => $date->startOfWeek(CarbonImmutable::MONDAY),
            'month' => $date->startOfMonth(),
            default => $date->startOfDay(),
        };
    }

    private function periodKey(CarbonImmutable $date, string $granularity): string
    {
        return $this->periodStart($date, $granularity)->toDateString();
    }

    private function periodLabel(CarbonImmutable $date, string $granularity): string
    {
        return match ($granularity) {
            'month' => $date->format('M Y'),
            default => $date->format('M j'),
        };
    }

    private function label(string $value): string
    {
        return str($value)->replace('_', ' ')->title()->toString();
    }
}
