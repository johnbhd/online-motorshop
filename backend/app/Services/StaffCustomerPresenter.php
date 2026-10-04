<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;

class StaffCustomerPresenter
{
    public function summary(
        Customer $customer,
        ?OrderRequest $latestOrder,
        array $branch,
    ): array {
        return [
            'id' => $customer->id,
            'name' => $customer->full_name,
            'initials' => $this->initials($customer->full_name),
            'type' => $customer->user_id === null ? 'guest' : 'registered',
            'contact' => $customer->contact_number,
            'email' => $this->email($customer),
            'address' => $customer->address,
            'branch' => $branch,
            'orders' => (int) ($customer->orders_count ?? 0),
            'active_orders' => (int) ($customer->active_orders_count ?? 0),
            'completed_orders' => (int) ($customer->completed_orders_count ?? 0),
            'customer_since' => $this->customerSince($customer),
            'last_order' => $latestOrder ? $this->order($latestOrder) : null,
        ];
    }

    public function profile(Customer $customer, array $branch): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->full_name,
            'initials' => $this->initials($customer->full_name),
            'type' => $customer->user_id === null ? 'guest' : 'registered',
            'contact' => $customer->contact_number,
            'email' => $this->email($customer),
            'address' => $customer->address,
            'branch' => $branch,
            'customer_since' => $this->customerSince($customer),
        ];
    }

    public function order(OrderRequest $order): array
    {
        return [
            'id' => $order->id,
            'reference' => $order->order_reference,
            'status' => $order->order_status,
            'fulfillment_method' => $order->fulfillment_type,
            'fulfillment_status' => $this->fulfillmentStatus($order),
            'payment_status' => $this->paymentStatus($order),
            'total_amount' => (float) $order->total_amount,
            'created_at' => $order->created_at?->toISOString(),
            'updated_at' => $order->updated_at?->toISOString(),
            'branch' => $order->branch?->only([
                'id',
                'name',
            ]),
        ];
    }

    private function email(Customer $customer): ?string
    {
        return $customer->user?->email ?? $customer->email;
    }

    private function customerSince(Customer $customer): ?string
    {
        return ($customer->user?->created_at ?? $customer->created_at)?->toISOString();
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

    private function paymentStatus(OrderRequest $order): string
    {
        if (! $order->relationLoaded('payments')) {
            return 'unpaid';
        }

        $payment = $order->payments
            ->sortByDesc(fn (Payment $item): string => implode('|', [
                $item->created_at?->toISOString() ?? '',
                str_pad((string) $item->id, 12, '0', STR_PAD_LEFT),
            ]))
            ->first();

        return $payment?->payment_status ?? 'unpaid';
    }

    private function fulfillmentStatus(OrderRequest $order): ?string
    {
        if ($order->fulfillment_type === 'pickup') {
            return $order->pickupRequest?->pickup_status;
        }

        return $order->deliveryRequest?->delivery_status;
    }
}
