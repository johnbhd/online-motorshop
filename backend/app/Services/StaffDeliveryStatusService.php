<?php

namespace App\Services;

use App\Models\DeliveryRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StaffDeliveryStatusService
{
    private const TRANSITIONS = [
        'waiting_for_booking' => [
            'booked',
            'cancelled',
        ],
        'booked' => [
            'picked_up',
            'failed',
            'cancelled',
        ],
        'picked_up' => [
            'in_transit',
            'failed',
        ],
        'in_transit' => [
            'delivered',
            'failed',
        ],
    ];

    public function allowedStatuses(DeliveryRequest $deliveryRequest): array
    {
        return self::TRANSITIONS[$deliveryRequest->delivery_status] ?? [];
    }

    public function transition(
        DeliveryRequest $deliveryRequest,
        string $status,
        array $attributes = [],
    ): DeliveryRequest {
        if (! in_array($status, $this->allowedStatuses($deliveryRequest), true)) {
            throw ValidationException::withMessages([
                'status' => [
                    "Delivery status cannot change from {$deliveryRequest->delivery_status} to {$status}.",
                ],
            ]);
        }

        if (
            $status === 'booked'
            && blank($attributes['booking_reference'] ?? $deliveryRequest->booking_reference)
        ) {
            throw ValidationException::withMessages([
                'booking_reference' => [
                    'A manual Lalamove booking reference is required before marking delivery as booked.',
                ],
            ]);
        }

        $allowedAttributes = array_intersect_key(
            $attributes,
            array_flip([
                'booking_reference',
                'tracking_url',
                'rider_name',
                'rider_contact',
                'remarks',
            ]),
        );

        return DB::transaction(function () use (
            $deliveryRequest,
            $status,
            $allowedAttributes,
        ): DeliveryRequest {
            $deliveryRequest->update([
                ...$allowedAttributes,
                'delivery_status' => $status,
                'delivered_at' => $status === 'delivered'
                    ? now()
                    : $deliveryRequest->delivered_at,
            ]);

            return $deliveryRequest->fresh();
        });
    }
}
