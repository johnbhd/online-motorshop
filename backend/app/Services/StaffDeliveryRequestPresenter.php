<?php

namespace App\Services;

use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\Payment;

class StaffDeliveryRequestPresenter
{
    public function summary(DeliveryRequest $deliveryRequest): array
    {
        $order = $deliveryRequest->order;

        return [
            'id' => $deliveryRequest->id,
            'order_reference' => $order?->order_reference,
            'order_status' => $order?->order_status,
            'customer' => $this->customerPayload($deliveryRequest),
            'branch' => $this->branchPayload($deliveryRequest),
            'amount' => $order ? (float) $order->total_amount : null,
            'payment' => $this->paymentPayload($order),
            'delivery_address' => $deliveryRequest->delivery_address,
            'delivery_fee' => (float) $deliveryRequest->delivery_fee,
            'booking_reference' => $deliveryRequest->booking_reference,
            'tracking_url' => $deliveryRequest->tracking_url,
            'rider_name' => $deliveryRequest->rider_name,
            'rider_contact' => $deliveryRequest->rider_contact,
            'delivery_status' => $deliveryRequest->delivery_status,
            'remarks' => $deliveryRequest->remarks,
            'delivered_at' => $deliveryRequest->delivered_at?->toISOString(),
            'item_count' => $order?->items->sum('quantity') ?? 0,
            'assigned_staff' => $deliveryRequest->assignedStaff?->only([
                'id',
                'name',
            ]),
            'created_at' => $deliveryRequest->created_at?->toISOString(),
            'updated_at' => $deliveryRequest->updated_at?->toISOString(),
        ];
    }

    public function details(
        DeliveryRequest $deliveryRequest,
        array $allowedStatuses,
    ): array {
        return [
            ...$this->summary($deliveryRequest),
            'allowed_statuses' => $allowedStatuses,
            'order' => $this->orderPayload($deliveryRequest->order),
        ];
    }

    private function customerPayload(DeliveryRequest $deliveryRequest): ?array
    {
        return $deliveryRequest->order?->customer?->only([
            'id',
            'full_name',
            'contact_number',
            'email',
            'address',
        ]);
    }

    private function branchPayload(DeliveryRequest $deliveryRequest): ?array
    {
        return $deliveryRequest->branch?->only([
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
