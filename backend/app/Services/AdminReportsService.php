<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\DeliveryRequest;
use App\Models\OrderItem;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use App\Models\Review;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class AdminReportsService
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

    public function report(array $filters): array
    {
        [$from, $to] = $this->dateRange($filters);
        $branchId = isset($filters['branch_id']) ? (int) $filters['branch_id'] : null;
        $orders = $this->orderScope($from, $to, $branchId);
        $successfulOrders = $this->successfulOrderScope($from, $to, $branchId);
        $payments = $this->paymentScope($from, $to, $branchId);
        $collectedPayments = $this->collectedPaymentScope($from, $to, $branchId);
        $granularity = $this->granularity($from, $to);

        return [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'branch_id' => $branchId,
                'branches' => Branch::query()
                    ->orderBy('name')
                    ->get(['id', 'name'])
                    ->map(fn (Branch $branch): array => [
                        'id' => $branch->id,
                        'name' => $branch->name,
                    ])
                    ->values()
                    ->all(),
            ],
            'overview' => $this->overview($orders, $successfulOrders, $collectedPayments),
            'order_trend' => $this->trend(
                $this->dailyCounts($orders),
                $this->dailySums($collectedPayments),
                $from,
                $to,
                $granularity,
            ),
            'order_statuses' => $this->orderStatuses($orders),
            'fulfillment' => $this->fulfillment($orders, $successfulOrders),
            'pickup' => $this->pickupAnalytics($from, $to, $branchId),
            'delivery' => $this->deliveryAnalytics($from, $to, $branchId),
            'payments' => $this->paymentAnalytics($payments),
            'branches' => $this->branchPerformance($orders, $successfulOrders, $collectedPayments, $from, $to, $branchId),
            'top_products' => $this->topProducts($successfulOrders),
            'categories' => $this->categoryPerformance($successfulOrders),
            'brands' => $this->brandPerformance($successfulOrders),
            'customers' => $this->customerAnalytics($from, $to, $branchId),
            'reviews' => $this->reviewAnalytics($from, $to, $branchId),
            'recent_successful_orders' => $this->recentSuccessfulOrders($successfulOrders),
        ];
    }

    private function overview(Builder $orders, Builder $successfulOrders, Builder $collectedPayments): array
    {
        $revenue = (float) (clone $collectedPayments)->sum('amount');
        $paidOrders = (clone $collectedPayments)->distinct()->count('order_id');

        return [
            'total_orders' => (clone $orders)->count(),
            'successful_orders' => (clone $successfulOrders)->count(),
            'revenue_collected' => round($revenue, 2),
            'paid_orders' => $paidOrders,
            'average_order_value' => $paidOrders > 0 ? round($revenue / $paidOrders, 2) : 0,
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
                'successful_orders' => (int) ($successful[$method] ?? 0),
                'percentage' => $total > 0 ? round(((int) ($totals[$method] ?? 0) / $total) * 100, 1) : 0,
            ])
            ->values()
            ->all();
    }

    private function pickupAnalytics(CarbonImmutable $from, CarbonImmutable $to, ?int $branchId): array
    {
        $counts = PickupRequest::query()
            ->whereHas('order', fn (Builder $query): Builder => $this->applyOrderWindow($query, $from, $to, $branchId))
            ->selectRaw('pickup_status, COUNT(*) as total')
            ->groupBy('pickup_status')
            ->pluck('total', 'pickup_status');

        return collect(PickupRequest::STATUS_VALUES)
            ->map(fn (string $status): array => [
                'key' => $status,
                'label' => $this->label($status),
                'value' => (int) ($counts[$status] ?? 0),
            ])
            ->values()
            ->all();
    }

    private function deliveryAnalytics(CarbonImmutable $from, CarbonImmutable $to, ?int $branchId): array
    {
        $counts = DeliveryRequest::query()
            ->whereHas('order', fn (Builder $query): Builder => $this->applyOrderWindow($query, $from, $to, $branchId))
            ->selectRaw('delivery_status, COUNT(*) as total')
            ->groupBy('delivery_status')
            ->pluck('total', 'delivery_status');

        return collect(DeliveryRequest::STATUS_VALUES)
            ->map(fn (string $status): array => [
                'key' => $status,
                'label' => $this->label($status),
                'value' => (int) ($counts[$status] ?? 0),
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
                    'label' => $method === Payment::METHOD_ONLINE_PAYMENT ? 'Online Payment' : 'Pay at Pickup',
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
        ];
    }

    private function branchPerformance(
        Builder $orders,
        Builder $successfulOrders,
        Builder $collectedPayments,
        CarbonImmutable $from,
        CarbonImmutable $to,
        ?int $branchId,
    ): array {
        $orderCounts = (clone $orders)
            ->whereNotNull('branch_id')
            ->selectRaw('branch_id, COUNT(*) as total')
            ->groupBy('branch_id')
            ->pluck('total', 'branch_id');
        $successfulCounts = (clone $successfulOrders)
            ->whereNotNull('branch_id')
            ->selectRaw('branch_id, COUNT(*) as total')
            ->groupBy('branch_id')
            ->pluck('total', 'branch_id');
        $revenueByBranch = (clone $collectedPayments)
            ->join('order_requests', 'order_requests.id', '=', 'payments.order_id')
            ->whereNotNull('order_requests.branch_id')
            ->selectRaw('order_requests.branch_id, SUM(payments.amount) as total')
            ->groupBy('order_requests.branch_id')
            ->pluck('total', 'order_requests.branch_id');
        $paidOrdersByBranch = (clone $collectedPayments)
            ->join('order_requests', 'order_requests.id', '=', 'payments.order_id')
            ->whereNotNull('order_requests.branch_id')
            ->selectRaw('order_requests.branch_id, COUNT(DISTINCT payments.order_id) as total')
            ->groupBy('order_requests.branch_id')
            ->pluck('total', 'order_requests.branch_id');
        $pickupCounts = $this->fulfillmentCountsByBranch(PickupRequest::class, $from, $to, $branchId);
        $deliveryCounts = $this->fulfillmentCountsByBranch(DeliveryRequest::class, $from, $to, $branchId);
        $branches = Branch::query()
            ->when($branchId !== null, fn (Builder $query): Builder => $query->whereKey($branchId))
            ->orderBy('name')
            ->get(['id', 'name']);

        return $branches->map(function (Branch $branch) use ($orderCounts, $successfulCounts, $revenueByBranch, $paidOrdersByBranch, $pickupCounts, $deliveryCounts): array {
            $orders = (int) ($orderCounts[$branch->id] ?? 0);
            $successful = (int) ($successfulCounts[$branch->id] ?? 0);
            $revenue = round((float) ($revenueByBranch[$branch->id] ?? 0), 2);
            $paidOrders = (int) ($paidOrdersByBranch[$branch->id] ?? 0);

            return [
                'branch_id' => $branch->id,
                'branch' => $branch->name,
                'orders' => $orders,
                'successful_orders' => $successful,
                'revenue' => $revenue,
                'average_order_value' => $paidOrders > 0 ? round($revenue / $paidOrders, 2) : 0,
                'pickup_orders' => (int) ($pickupCounts[$branch->id] ?? 0),
                'delivery_orders' => (int) ($deliveryCounts[$branch->id] ?? 0),
            ];
        })->values()->all();
    }

    private function fulfillmentCountsByBranch(string $model, CarbonImmutable $from, CarbonImmutable $to, ?int $branchId): Collection
    {
        return $model::query()
            ->whereHas('order', fn (Builder $query): Builder => $this->applyOrderWindow($query, $from, $to, $branchId))
            ->selectRaw('branch_id, COUNT(*) as total')
            ->groupBy('branch_id')
            ->pluck('total', 'branch_id');
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

    private function categoryPerformance(Builder $successfulOrders): array
    {
        return $this->successfulItemQuery($successfulOrders)
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->selectRaw("COALESCE(categories.name, 'Unassigned') as label, SUM(order_items.quantity) as units_sold, SUM(order_items.subtotal) as revenue")
            ->groupBy('categories.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(fn ($row): array => [
                'label' => $row->label,
                'units_sold' => (int) $row->units_sold,
                'revenue' => round((float) $row->revenue, 2),
            ])
            ->values()
            ->all();
    }

    private function brandPerformance(Builder $successfulOrders): array
    {
        return $this->successfulItemQuery($successfulOrders)
            ->leftJoin('brands', 'brands.id', '=', 'products.brand_id')
            ->selectRaw("COALESCE(brands.name, products.brand, 'Unassigned') as label, SUM(order_items.quantity) as units_sold, SUM(order_items.subtotal) as revenue")
            ->groupBy('brands.name', 'products.brand')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->map(fn ($row): array => [
                'label' => $row->label,
                'units_sold' => (int) $row->units_sold,
                'revenue' => round((float) $row->revenue, 2),
            ])
            ->values()
            ->all();
    }

    private function customerAnalytics(CarbonImmutable $from, CarbonImmutable $to, ?int $branchId): array
    {
        $scope = Customer::query()->whereHas(
            'orderRequests',
            fn (Builder $query): Builder => $this->applyOrderWindow($query, $from, $to, $branchId),
        );
        $repeatCustomers = $this->orderScope($from, $to, $branchId)
            ->select('customer_id')
            ->whereNotNull('customer_id')
            ->groupBy('customer_id')
            ->havingRaw('COUNT(*) > 1')
            ->get()
            ->count();
        $newRegistered = (clone $scope)
            ->whereNotNull('user_id')
            ->whereHas('user', fn (Builder $query): Builder => $query->whereBetween('created_at', [$from, $to]))
            ->count();

        return [
            'total' => (clone $scope)->count(),
            'registered' => (clone $scope)->whereNotNull('user_id')->count(),
            'guests' => (clone $scope)->whereNull('user_id')->count(),
            'with_orders' => (clone $scope)->count(),
            'repeat_customers' => $repeatCustomers,
            'new_registered' => $newRegistered,
        ];
    }

    private function reviewAnalytics(CarbonImmutable $from, CarbonImmutable $to, ?int $branchId): array
    {
        $reviews = Review::query()->whereHas(
            'order',
            fn (Builder $query): Builder => $this->applyOrderWindow($query, $from, $to, $branchId),
        );
        $statuses = (clone $reviews)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');
        $ratings = (clone $reviews)
            ->selectRaw('rating, COUNT(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');
        $publishedAverage = (float) ((clone $reviews)->where('status', Review::STATUS_PUBLISHED)->avg('rating') ?? 0);

        return [
            'total' => (clone $reviews)->count(),
            'average_rating' => round($publishedAverage, 2),
            'statuses' => collect(Review::STATUSES)
                ->map(fn (string $status): array => [
                    'key' => $status,
                    'label' => $this->label($status),
                    'value' => (int) ($statuses[$status] ?? 0),
                ])
                ->values()
                ->all(),
            'ratings' => collect([1, 2, 3, 4, 5])
                ->map(fn (int $rating): array => [
                    'rating' => $rating,
                    'value' => (int) ($ratings[$rating] ?? 0),
                ])
                ->values()
                ->all(),
        ];
    }

    private function recentSuccessfulOrders(Builder $successfulOrders): array
    {
        return (clone $successfulOrders)
            ->with('branch:id,name')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(8)
            ->get(['id', 'order_reference', 'branch_id', 'fulfillment_type', 'total_amount', 'created_at'])
            ->map(fn (OrderRequest $order): array => [
                'reference' => $order->order_reference,
                'branch' => $order->branch?->name,
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

    private function trend(Collection $orders, Collection $revenue, CarbonImmutable $from, CarbonImmutable $to, string $granularity): array
    {
        $orderBuckets = $orders->groupBy(fn ($row): string => $this->periodKey(CarbonImmutable::parse((string) $row->bucket, 'UTC'), $granularity));
        $revenueBuckets = $revenue->groupBy(fn ($row): string => $this->periodKey(CarbonImmutable::parse((string) $row->bucket, 'UTC'), $granularity));
        $series = [];
        $cursor = $this->periodStart($from, $granularity);
        $last = $this->periodStart($to, $granularity);

        while ($cursor->lessThanOrEqualTo($last)) {
            $key = $cursor->toDateString();
            $series[] = [
                'key' => $key,
                'label' => $this->periodLabel($cursor, $granularity),
                'orders' => (int) $orderBuckets->get($key, collect())->sum('total'),
                'revenue' => round((float) $revenueBuckets->get($key, collect())->sum('total'), 2),
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

    private function orderScope(CarbonImmutable $from, CarbonImmutable $to, ?int $branchId): Builder
    {
        return $this->applyOrderWindow(OrderRequest::query(), $from, $to, $branchId);
    }

    private function successfulOrderScope(CarbonImmutable $from, CarbonImmutable $to, ?int $branchId): Builder
    {
        return $this->orderScope($from, $to, $branchId)
            ->whereNotIn('order_status', ['rejected', 'cancelled'])
            ->whereHas('payments', fn (Builder $query): Builder => $query->where('payment_status', Payment::STATUS_PAID))
            ->where(function (Builder $query): void {
                $query
                    ->where(function (Builder $pickup): void {
                        $pickup
                            ->where('fulfillment_type', 'pickup')
                            ->whereHas('pickupRequest', fn (Builder $request): Builder => $request->where('pickup_status', 'completed'));
                    })
                    ->orWhere(function (Builder $delivery): void {
                        $delivery
                            ->where('fulfillment_type', 'delivery')
                            ->whereHas('deliveryRequest', fn (Builder $request): Builder => $request->where('delivery_status', 'delivered'));
                    });
            });
    }

    private function paymentScope(CarbonImmutable $from, CarbonImmutable $to, ?int $branchId): Builder
    {
        return Payment::query()->whereHas(
            'order',
            fn (Builder $query): Builder => $this->applyOrderWindow($query, $from, $to, $branchId),
        );
    }

    private function collectedPaymentScope(CarbonImmutable $from, CarbonImmutable $to, ?int $branchId): Builder
    {
        return $this->paymentScope($from, $to, $branchId)
            ->where('payment_status', Payment::STATUS_PAID)
            ->whereHas('order', fn (Builder $query): Builder => $query->whereNotIn('order_status', ['rejected', 'cancelled']));
    }

    private function applyOrderWindow(Builder $query, CarbonImmutable $from, CarbonImmutable $to, ?int $branchId): Builder
    {
        return $query
            ->whereBetween('created_at', [$from, $to])
            ->when($branchId !== null, fn (Builder $builder): Builder => $builder->where('branch_id', $branchId));
    }

    /** @return array{0: CarbonImmutable, 1: CarbonImmutable} */
    private function dateRange(array $filters): array
    {
        $today = CarbonImmutable::now('UTC');
        $from = CarbonImmutable::parse($filters['from'] ?? $today->startOfMonth()->toDateString(), 'UTC')->startOfDay();
        $to = CarbonImmutable::parse($filters['to'] ?? $today->toDateString(), 'UTC')->endOfDay();

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
