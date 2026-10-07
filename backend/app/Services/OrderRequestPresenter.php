<?php

namespace App\Services;

use App\Models\OrderRequest;
use App\Models\Payment;

class OrderRequestPresenter
{
    public function confirmation(OrderRequest $order): array
    {
        return $this->payload($order, includeCustomer: true, includePayment: true);
    }

    public function summary(OrderRequest $order): array
    {
        return [
            'id' => $order->id,
            'reference' => $order->order_reference,
            'status' => $order->order_status,
            'payment_status' => $this->paymentStatus($order),
            'payment' => $this->paymentPayload($order),
            'fulfillment_method' => $order->fulfillment_type,
            'branch' => $this->branchPayload($order),
            'item_count' => (int) ($order->getAttribute('items_sum_quantity') ?? 0),
            'line_item_count' => (int) ($order->getAttribute('items_count') ?? 0),
            'subtotal' => (float) $order->subtotal,
            'delivery_fee' => (float) $order->delivery_fee,
            'estimated_total' => (float) $order->total_amount,
            'total_amount' => (float) $order->total_amount,
            'created_at' => $order->created_at?->toISOString(),
            'updated_at' => $order->updated_at?->toISOString(),
        ];
    }

    public function staffSummary(OrderRequest $order): array
    {
        return [
            'id' => $order->id,
            'reference' => $order->order_reference,
            'customer' => $order->customer?->only([
                'id',
                'full_name',
                'contact_number',
                'email',
            ]),
            'status' => $order->order_status,
            'payment_status' => $this->paymentStatus($order),
            'fulfillment_method' => $order->fulfillment_type,
            'branch' => $this->branchPayload($order),
            'item_count' => (int) ($order->getAttribute('items_sum_quantity') ?? 0),
            'line_item_count' => (int) ($order->getAttribute('items_count') ?? 0),
            'subtotal' => (float) $order->subtotal,
            'delivery_fee' => (float) $order->delivery_fee,
            'estimated_total' => (float) $order->total_amount,
            'total_amount' => (float) $order->total_amount,
            'created_at' => $order->created_at?->toISOString(),
            'updated_at' => $order->updated_at?->toISOString(),
        ];
    }

    public function staffDetail(OrderRequest $order): array
    {
        $payload = $this->payload($order, includeCustomer: true, includePayment: true);
        $payload['staff_notes'] = $order->staff_notes;
        $payload['assigned_staff'] = $order->assignedStaff?->only([
            'id',
            'name',
            'email',
            'branch_id',
        ]);

        return $payload;
    }

    public function detail(
        OrderRequest $order,
        bool $includeCustomer = true,
        bool $includePayment = true,
    ): array {
        return $this->payload($order, $includeCustomer, $includePayment);
    }

    private function payload(
        OrderRequest $order,
        bool $includeCustomer,
        bool $includePayment,
    ): array {
        $payload = [
            'id' => $order->id,
            'reference' => $order->order_reference,
            'status' => $order->order_status,
            'payment_status' => $this->paymentStatus($order),
            'fulfillment_method' => $order->fulfillment_type,
            'branch' => $this->branchPayload($order),
            'items' => $order->items->map(fn ($item): array => [
                'product_id' => $item->product_id,
                'part_number' => $item->product?->part_number,
                'name' => $item->product_name,
                'unit_price' => (float) $item->unit_price,
                'quantity' => $item->quantity,
                'line_total' => (float) $item->subtotal,
            ])->values()->all(),
            'subtotal' => (float) $order->subtotal,
            'delivery_fee' => (float) $order->delivery_fee,
            'estimated_total' => (float) $order->total_amount,
            'total_amount' => (float) $order->total_amount,
            'customer_notes' => $order->customer_notes,
            'created_at' => $order->created_at?->toISOString(),
            'updated_at' => $order->updated_at?->toISOString(),
        ];

        if ($includeCustomer) {
            $payload['customer'] = $order->customer?->only([
                'id',
                'full_name',
                'contact_number',
                'email',
                'address',
            ]);
        }

        if ($includePayment) {
            $payload['payment'] = $this->paymentPayload($order);
        }

        if ($order->fulfillment_type === 'pickup') {
            $payload['pickup'] = $this->pickupPayload($order);
        } else {
            $payload['delivery'] = $this->deliveryPayload($order);
        }

        return $payload;
    }

    private function branchPayload(OrderRequest $order): ?array
    {
        return $order->branch?->only([
            'id',
            'name',
            'address',
            'contact_number',
        ]);
    }

    private function pickupPayload(OrderRequest $order): ?array
    {
        $pickup = $order->pickupRequest;

        if (! $pickup) {
            return null;
        }

        return [
            'branch_id' => $pickup->branch_id,
            'status' => $pickup->pickup_status,
            'pickup_date' => $pickup->pickup_date?->toDateString(),
            'pickup_time' => $pickup->pickup_time,
            'remarks' => $pickup->remarks,
            'completed_at' => $pickup->completed_at?->toISOString(),
        ];
    }

    private function deliveryPayload(OrderRequest $order): ?array
    {
        $delivery = $order->deliveryRequest;

        if (! $delivery) {
            return null;
        }

        return [
            'branch_id' => $delivery->branch_id,
            'address' => $delivery->delivery_address,
            'fee' => (float) $delivery->delivery_fee,
            'status' => $delivery->delivery_status,
            'booking_reference' => $delivery->booking_reference,
            'tracking_url' => $delivery->tracking_url,
            'rider_name' => $delivery->rider_name,
            'rider_contact' => $delivery->rider_contact,
            'remarks' => $delivery->remarks,
            'delivered_at' => $delivery->delivered_at?->toISOString(),
        ];
    }

    private function paymentStatus(OrderRequest $order): string
    {
        return $this->latestPayment($order)?->payment_status ?? 'unpaid';
    }

    private function paymentPayload(OrderRequest $order): ?array
    {
        $payment = $this->latestPayment($order);

        if (! $payment) {
            return null;
        }

        return [
            'id' => $payment->id,
            'method' => $payment->payment_method,
            'amount' => (float) $payment->amount,
            'reference' => $payment->payment_reference,
            'status' => $payment->payment_status,
            'verified_at' => $payment->verified_at?->toISOString(),
        ];
    }

    private function latestPayment(OrderRequest $order): ?Payment
    {
        if (! $order->relationLoaded('payments')) {
            return null;
        }

        return $order->payments
            ->sortByDesc(fn (Payment $payment): int => $payment->created_at?->getTimestamp() ?? 0)
            ->sortByDesc('id')
            ->first();
    }
}
