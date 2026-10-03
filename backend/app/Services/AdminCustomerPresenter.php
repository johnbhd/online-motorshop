<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\OrderRequest;
use Carbon\Carbon;

class AdminCustomerPresenter
{
    public function summary(Customer $customer, ?OrderRequest $latestOrder = null): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->full_name,
            'initials' => $this->initials($customer->full_name),
            'type' => $customer->user_id === null ? 'guest' : 'registered',
            'contact' => $customer->contact_number,
            'email' => $this->email($customer),
            'address' => $customer->address,
            'account_status' => $customer->user?->status,
            'account_created_at' => $customer->user?->created_at?->toISOString(),
            'customer_since' => ($customer->user?->created_at ?? $customer->created_at)?->toISOString(),
            'orders' => (int) ($customer->orders_count ?? 0),
            'active_orders' => (int) ($customer->active_orders_count ?? 0),
            'completed_orders' => (int) ($customer->completed_orders_count ?? 0),
            'last_order_at' => $customer->last_order_at
                ? Carbon::parse($customer->last_order_at)->toISOString()
                : null,
            'last_order' => $latestOrder ? $this->order($latestOrder) : null,
            'branches' => $customer->relationLoaded('orderRequests')
                ? $this->branches($customer->orderRequests)
                : [],
        ];
    }

    public function detail(Customer $customer, array $orders, array $branches): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->full_name,
            'initials' => $this->initials($customer->full_name),
            'type' => $customer->user_id === null ? 'guest' : 'registered',
            'contact' => $customer->contact_number,
            'email' => $this->email($customer),
            'address' => $customer->address,
            'customer_since' => ($customer->user?->created_at ?? $customer->created_at)?->toISOString(),
            'account' => $customer->user ? [
                'id' => $customer->user->id,
                'email' => $customer->user->email,
                'status' => $customer->user->status,
                'created_at' => $customer->user->created_at?->toISOString(),
            ] : null,
            'summary' => [
                'orders' => (int) ($customer->orders_count ?? 0),
                'active_orders' => (int) ($customer->active_orders_count ?? 0),
                'completed_orders' => (int) ($customer->completed_orders_count ?? 0),
                'branches_used' => count($branches),
                'last_order' => $orders[0] ?? null,
            ],
            'branches' => $branches,
            'orders' => $orders,
        ];
    }

    public function order(OrderRequest $order): array
    {
        $payment = $order->relationLoaded('payments')
            ? $order->payments->sortByDesc('created_at')->first()
            : null;

        return [
            'id' => $order->id,
            'reference' => $order->order_reference,
            'status' => $order->order_status,
            'fulfillment_method' => $order->fulfillment_type,
            'fulfillment_status' => $order->pickupRequest?->pickup_status
                ?? $order->deliveryRequest?->delivery_status,
            'payment_status' => $payment?->payment_status ?? 'unpaid',
            'total_amount' => (float) $order->total_amount,
            'created_at' => $order->created_at?->toISOString(),
            'updated_at' => $order->updated_at?->toISOString(),
            'branch' => $order->branch?->only(['id', 'name']),
        ];
    }

    public function branchActivity(Customer $customer): array
    {
        return $this->branches($customer->orderRequests);
    }

    private function branches($orders): array
    {
        return $orders
            ->filter(fn (OrderRequest $order): bool => $order->branch !== null)
            ->groupBy('branch_id')
            ->map(fn ($items): array => [
                'id' => $items->first()->branch->id,
                'name' => $items->first()->branch->name,
                'orders' => $items->count(),
            ])
            ->values()
            ->all();
    }

    private function email(Customer $customer): ?string
    {
        return $customer->user?->email ?? $customer->email;
    }

    private function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name), -1, PREG_SPLIT_NO_EMPTY);

        if ($parts === false || $parts === []) {
            return '?';
        }

        return collect(array_slice($parts, 0, 2))
            ->map(fn (string $part): string => mb_strtoupper(mb_substr($part, 0, 1)))
            ->implode('');
    }
}
