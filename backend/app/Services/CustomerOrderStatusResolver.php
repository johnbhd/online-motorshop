<?php

namespace App\Services;

use App\Models\OrderRequest;

class CustomerOrderStatusResolver
{
    public function resolve(OrderRequest $order): string
    {
        $orderStatus = strtolower(trim((string) $order->order_status));

        if (in_array($orderStatus, ['rejected', 'cancelled'], true)) {
            return $orderStatus;
        }

        if ($orderStatus !== 'confirmed' || $order->fulfillment_type !== 'pickup') {
            return $orderStatus;
        }

        return match ($order->pickupRequest?->pickup_status) {
            'preparing', 'ready_for_pickup', 'completed' => $order->pickupRequest->pickup_status,
            default => 'confirmed',
        };
    }

    public function fulfillmentStatus(OrderRequest $order): ?string
    {
        return $order->fulfillment_type === 'pickup'
            ? $order->pickupRequest?->pickup_status
            : $order->deliveryRequest?->delivery_status;
    }
}
