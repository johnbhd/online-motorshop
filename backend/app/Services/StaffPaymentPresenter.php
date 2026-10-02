<?php

namespace App\Services;

use App\Models\OrderRequest;
use App\Models\Payment;

class StaffPaymentPresenter
{
    public function summary(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'order_reference' => $payment->order?->order_reference,
            'order_status' => $payment->order?->order_status,
            'order_total' => $payment->order ? (float) $payment->order->total_amount : null,
            'customer' => $this->customerPayload($payment),
            'branch' => $this->branchPayload($payment),
            'amount' => (float) $payment->amount,
            'method' => $payment->payment_method,
            'reference' => $payment->payment_reference,
            'proof_image_url' => $payment->proof_image_url,
            'status' => $payment->payment_status,
            'created_at' => $payment->created_at?->toISOString(),
            'verified_at' => $payment->verified_at?->toISOString(),
            'verified_by' => $payment->verifiedBy?->only([
                'id',
                'name',
            ]),
        ];
    }

    public function details(Payment $payment, array $allowedStatuses): array
    {
        return [
            ...$this->summary($payment),
            'allowed_statuses' => $allowedStatuses,
            'order' => $this->orderPayload($payment->order),
        ];
    }

    private function customerPayload(Payment $payment): ?array
    {
        return $payment->order?->customer?->only([
            'id',
            'full_name',
            'contact_number',
            'email',
        ]);
    }

    private function branchPayload(Payment $payment): ?array
    {
        return $payment->order?->branch?->only([
            'id',
            'name',
            'address',
            'contact_number',
        ]);
    }

    private function orderPayload(?OrderRequest $order): ?array
    {
        if (! $order) {
            return null;
        }

        return [
            'id' => $order->id,
            'reference' => $order->order_reference,
            'status' => $order->order_status,
            'fulfillment_method' => $order->fulfillment_type,
            'subtotal' => (float) $order->subtotal,
            'delivery_fee' => (float) $order->delivery_fee,
            'total_amount' => (float) $order->total_amount,
            'items' => $order->items
                ->map(fn ($item): array => [
                    'product_id' => $item->product_id,
                    'name' => $item->product_name,
                    'unit_price' => (float) $item->unit_price,
                    'quantity' => $item->quantity,
                    'line_total' => (float) $item->subtotal,
                ])
                ->values()
                ->all(),
        ];
    }
}
