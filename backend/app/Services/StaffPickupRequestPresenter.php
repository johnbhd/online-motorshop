<?php

namespace App\Services;

use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;

class StaffPickupRequestPresenter
{
    public function summary(PickupRequest $pickupRequest): array
    {
        $order = $pickupRequest->order;

        return [
            'id' => $pickupRequest->id,
            'order_reference' => $order?->order_reference,
            'order_status' => $order?->order_status,
            'customer' => $this->customerPayload($pickupRequest),
            'branch' => $this->branchPayload($pickupRequest),
            'amount' => $order ? (float) $order->total_amount : null,
            'payment' => $this->paymentPayload($order),
            'pickup_status' => $pickupRequest->pickup_status,
            'pickup_date' => $pickupRequest->pickup_date?->toDateString(),
            'pickup_time' => $pickupRequest->pickup_time,
            'remarks' => $pickupRequest->remarks,
            'completed_at' => $pickupRequest->completed_at?->toISOString(),
            'item_count' => $order?->items_count ?? $order?->items->sum('quantity') ?? 0,
            'assigned_staff' => $pickupRequest->assignedStaff?->only([
                'id',
                'name',
            ]),
            'created_at' => $pickupRequest->created_at?->toISOString(),
            'updated_at' => $pickupRequest->updated_at?->toISOString(),
        ];
    }

    public function details(
        PickupRequest $pickupRequest,
        array $allowedStatuses,
    ): array {
        return [
            ...$this->summary($pickupRequest),
            'allowed_statuses' => $allowedStatuses,
            'order' => $this->orderPayload($pickupRequest->order),
        ];
    }

    private function customerPayload(PickupRequest $pickupRequest): ?array
    {
        return $pickupRequest->order?->customer?->only([
            'id',
            'full_name',
            'contact_number',
            'email',
            'address',
        ]);
    }

    private function branchPayload(PickupRequest $pickupRequest): ?array
    {
        return $pickupRequest->branch?->only([
            'id',
            'name',
            'address',
            'contact_number',
        ]);
    }

    private function paymentPayload(?OrderRequest $order): ?array
    {
        $payment = $order?->payments
            ?->sortByDesc(fn (Payment $item): string => implode('|', [
                $item->created_at?->toISOString() ?? '',
                str_pad((string) $item->id, 12, '0', STR_PAD_LEFT),
            ]))
            ->first();

        if (! $payment) {
            return null;
        }

        return [
            'id' => $payment->id,
            'method' => $payment->payment_method,
            'amount' => $payment->amount !== null ? (float) $payment->amount : null,
            'reference' => $payment->payment_reference,
            'status' => $payment->payment_status,
            'verified_at' => $payment->verified_at?->toISOString(),
        ];
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
                    'part_number' => $item->product?->part_number,
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
