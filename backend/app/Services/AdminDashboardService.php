<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class AdminDashboardService
{
    public function __construct(private readonly AdminArchiveService $archiveService) {}

    public function summary(): array
    {
        $orderCounts = $this->statusCounts(
            $this->archiveService->excludeArchived(OrderRequest::query(), 'order'),
            'order_status',
        );
        $paymentsAttention = $this->archiveService->excludeArchived(Payment::query(), 'payment')
            ->whereIn('payment_status', StaffOperationalSummaryService::PAYMENT_ATTENTION_STATUSES)
            ->count();
        $pickupsAttention = PickupRequest::query()
            ->whereHas('order', fn (Builder $query): Builder => $this->archiveService->excludeArchived($query, 'order'))
            ->whereIn('pickup_status', StaffOperationalSummaryService::PICKUP_ATTENTION_STATUSES)
            ->count();
        $deliveriesAttention = DeliveryRequest::query()
            ->whereHas('order', fn (Builder $query): Builder => $this->archiveService->excludeArchived($query, 'order'))
            ->whereIn('delivery_status', StaffOperationalSummaryService::DELIVERY_ATTENTION_STATUSES)
            ->count();
        $conversations = Conversation::query()
            ->where('status', 'open')
            ->whereHas(
                'latestMessage',
                fn (Builder $query): Builder => $query->where('sender_type', 'customer'),
            )
            ->count();

        $customerQuery = $this->archiveService->excludeArchived(Customer::query(), 'customer');
        $customerCount = (clone $customerQuery)->count();
        $registeredCustomerCount = (clone $customerQuery)->whereNotNull('user_id')->count();

        return [
            'total_orders' => array_sum($orderCounts),
            'active_orders' => $this->countExcept(
                $orderCounts,
                OrderRequest::TERMINAL_STATUSES,
            ),
            'pending_orders' => $orderCounts['pending'] ?? 0,
            'payments_attention' => $paymentsAttention,
            'pickups_attention' => $pickupsAttention,
            'deliveries_attention' => $deliveriesAttention,
            'active_fulfillment' => $pickupsAttention + $deliveriesAttention,
            'conversations' => $conversations,
            'customers' => $customerCount,
            'registered_customers' => $registeredCustomerCount,
            'guest_customers' => $customerCount - $registeredCustomerCount,
            'staff' => $this->archiveService->excludeArchived(User::query(), 'staff')->where('role', 'staff')->count(),
            'products' => $this->archiveService->excludeArchived(Product::query(), 'product')->count(),
            'branches' => $this->archiveService->excludeArchived(Branch::query(), 'branch')->count(),
        ];
    }

    /**
     * @return Collection<int, array<string, int|string>>
     */
    public function branches(): Collection
    {
        $orderCounts = $this->branchStatusCounts(
            $this->archiveService->excludeArchived(OrderRequest::query(), 'order'),
            'order_status',
        );
        $pickupCounts = $this->branchStatusCounts(
            PickupRequest::query()->whereHas('order', fn (Builder $query): Builder => $this->archiveService->excludeArchived($query, 'order')),
            'pickup_status',
        );
        $deliveryCounts = $this->branchStatusCounts(
            DeliveryRequest::query()->whereHas('order', fn (Builder $query): Builder => $this->archiveService->excludeArchived($query, 'order')),
            'delivery_status',
        );

        return $this->archiveService->excludeArchived(Branch::query(), 'branch')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(function (Branch $branch) use (
                $orderCounts,
                $pickupCounts,
                $deliveryCounts,
            ): array {
                $branchOrders = $orderCounts[$branch->id] ?? [];
                $branchPickups = $pickupCounts[$branch->id] ?? [];
                $branchDeliveries = $deliveryCounts[$branch->id] ?? [];

                return [
                    'id' => (int) $branch->id,
                    'name' => $branch->name,
                    'orders' => array_sum($branchOrders),
                    'active_orders' => $this->countExcept(
                        $branchOrders,
                        OrderRequest::TERMINAL_STATUSES,
                    ),
                    'pending_orders' => $branchOrders['pending'] ?? 0,
                    'pickup_requests' => $this->countStatuses(
                        $branchPickups,
                        StaffOperationalSummaryService::PICKUP_ATTENTION_STATUSES,
                    ),
                    'delivery_requests' => $this->countStatuses(
                        $branchDeliveries,
                        StaffOperationalSummaryService::DELIVERY_ATTENTION_STATUSES,
                    ),
                ];
            })
            ->values();
    }

    public function recentOrders(int $limit = 5): Collection
    {
        return $this->archiveService->excludeArchived(OrderRequest::query(), 'order')
            ->with([
                'customer:id,full_name,contact_number,email',
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

    /**
     * @return array<string, int>
     */
    private function statusCounts(Builder $query, string $statusColumn): array
    {
        return $query
            ->select($statusColumn, DB::raw('COUNT(*) as aggregate'))
            ->groupBy($statusColumn)
            ->get()
            ->mapWithKeys(fn ($row): array => [
                (string) $row->{$statusColumn} => (int) $row->aggregate,
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, int>>
     */
    private function branchStatusCounts(Builder $query, string $statusColumn): array
    {
        return $query
            ->select('branch_id', $statusColumn, DB::raw('COUNT(*) as aggregate'))
            ->whereNotNull('branch_id')
            ->groupBy('branch_id', $statusColumn)
            ->get()
            ->reduce(function (array $counts, $row) use ($statusColumn): array {
                $branchId = (int) $row->branch_id;
                $counts[$branchId][(string) $row->{$statusColumn}] = (int) $row->aggregate;

                return $counts;
            }, []);
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
}
