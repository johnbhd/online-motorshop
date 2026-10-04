<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class StaffOperationalSummaryService
{
    public const ORDER_TERMINAL_STATUSES = OrderRequest::TERMINAL_STATUSES;

    public const PAYMENT_ATTENTION_STATUSES = [
        'waiting_for_verification',
    ];

    public const PICKUP_ATTENTION_STATUSES = [
        'pending',
        'preparing',
        'ready_for_pickup',
    ];

    public const DELIVERY_ATTENTION_STATUSES = [
        'waiting_for_booking',
        'booked',
        'picked_up',
        'in_transit',
    ];

    /**
     * @return array{summary: array<string, int>, operational: array<string, array<string, int>>}
     */
    public function dashboard(int $branchId): array
    {
        $orderCounts = $this->statusCounts(
            OrderRequest::query()->where('branch_id', $branchId),
            'order_status',
        );
        $paymentCounts = $this->statusCounts(
            $this->paymentsQuery($branchId),
            'payment_status',
        );
        $pickupCounts = $this->statusCounts(
            PickupRequest::query()->where('branch_id', $branchId),
            'pickup_status',
        );
        $deliveryCounts = $this->statusCounts(
            DeliveryRequest::query()->where('branch_id', $branchId),
            'delivery_status',
        );

        return [
            'summary' => [
                'active_orders' => $this->countExcept(
                    $orderCounts,
                    self::ORDER_TERMINAL_STATUSES,
                ),
                'pending_orders' => $this->countStatuses($orderCounts, ['pending']),
                'under_review_orders' => $this->countStatuses($orderCounts, ['under_review']),
                'confirmed_orders' => $this->countStatuses($orderCounts, ['confirmed']),
                'completed_orders' => $this->countStatuses($orderCounts, ['completed']),
                'completed_today' => $this->completedTodayCount($branchId),
                'payments_attention' => $this->countStatuses(
                    $paymentCounts,
                    self::PAYMENT_ATTENTION_STATUSES,
                ),
                'pickups_attention' => $this->countStatuses(
                    $pickupCounts,
                    self::PICKUP_ATTENTION_STATUSES,
                ),
                'deliveries_attention' => $this->countStatuses(
                    $deliveryCounts,
                    self::DELIVERY_ATTENTION_STATUSES,
                ),
                'conversations' => $this->customerConversationCount(),
            ],
            'operational' => [
                'orders' => $orderCounts,
                'payments' => $paymentCounts,
                'pickups' => [
                    'active' => $this->countStatuses(
                        $pickupCounts,
                        self::PICKUP_ATTENTION_STATUSES,
                    ),
                    ...$pickupCounts,
                ],
                'deliveries' => [
                    'active' => $this->countStatuses(
                        $deliveryCounts,
                        self::DELIVERY_ATTENTION_STATUSES,
                    ),
                    ...$deliveryCounts,
                ],
            ],
        ];
    }

    /**
     * @return array<string, int>
     */
    public function sidebarCounts(int $branchId): array
    {
        $dashboard = $this->dashboard($branchId);
        $summary = $dashboard['summary'];

        return [
            'orders' => $summary['pending_orders'],
            'payments' => $summary['payments_attention'],
            'pickup_requests' => $summary['pickups_attention'],
            'delivery_requests' => $summary['deliveries_attention'],
            'messages' => $summary['conversations'],
        ];
    }

    public function recentOrders(int $branchId, int $limit = 5): Collection
    {
        return OrderRequest::query()
            ->where('branch_id', $branchId)
            ->with([
                'customer:id,full_name,contact_number,email,address',
                'branch:id,name,address,contact_number',
                'payments:id,order_id,payment_method,amount,payment_reference,payment_status,created_at,verified_at',
            ])
            ->withCount('items')
            ->withSum('items', 'quantity')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    public function recentConversations(int $limit = 5): Collection
    {
        return Conversation::query()
            ->where('status', 'open')
            ->with(['customer.user', 'latestMessage'])
            ->withCount('messages')
            ->orderByDesc('last_message_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    /**
     * @return array<string, int>
     */
    private function statusCounts(Builder $query, string $column): array
    {
        return $query
            ->select($column, DB::raw('COUNT(*) as aggregate'))
            ->groupBy($column)
            ->get()
            ->mapWithKeys(fn ($row): array => [
                (string) $row->{$column} => (int) $row->aggregate,
            ])
            ->all();
    }

    private function paymentsQuery(int $branchId): Builder
    {
        return Payment::query()->whereHas(
            'order',
            fn (Builder $query): Builder => $query->where('branch_id', $branchId),
        );
    }

    /**
     * @param  array<string, int>  $counts
     * @param  array<int, string>  $statuses
     */
    private function countStatuses(array $counts, array $statuses): int
    {
        return array_sum(array_map(
            fn (string $status): int => $counts[$status] ?? 0,
            $statuses,
        ));
    }

    /**
     * @param  array<string, int>  $counts
     * @param  array<int, string>  $excludedStatuses
     */
    private function countExcept(array $counts, array $excludedStatuses): int
    {
        return array_sum(array_diff_key($counts, array_flip($excludedStatuses)));
    }

    private function completedTodayCount(int $branchId): int
    {
        return OrderRequest::query()
            ->where('branch_id', $branchId)
            ->where('order_status', 'completed')
            ->whereDate('updated_at', now()->toDateString())
            ->count();
    }

    private function customerConversationCount(): int
    {
        return Conversation::query()
            ->where('status', 'open')
            ->whereHas(
                'latestMessage',
                fn (Builder $query): Builder => $query->where('sender_type', 'customer'),
            )
            ->count();
    }
}
