<?php

namespace App\Services;

use App\Events\OrderStatusChanged;
use App\Models\PickupRequest;
use Illuminate\Validation\ValidationException;

class StaffPickupStatusService
{
    private const TRANSITIONS = [
        'pending' => [
            'preparing',
        ],
        'preparing' => [
            'ready_for_pickup',
        ],
        'ready_for_pickup' => [
            'completed',
        ],
    ];

    public function allowedStatuses(PickupRequest $pickupRequest): array
    {
        return self::TRANSITIONS[$pickupRequest->pickup_status] ?? [];
    }

    public function transition(
        PickupRequest $pickupRequest,
        string $status,
    ): PickupRequest {
        if (! in_array($status, $this->allowedStatuses($pickupRequest), true)) {
            throw ValidationException::withMessages([
                'status' => [
                    "Pickup status cannot change from {$pickupRequest->pickup_status} to {$status}.",
                ],
            ]);
        }

        $previousStatus = (string) $pickupRequest->pickup_status;

        $pickupRequest->update([
            'pickup_status' => $status,
            'completed_at' => $status === 'completed'
                ? now()
                : $pickupRequest->completed_at,
        ]);

        $pickupRequest = $pickupRequest->fresh();
        $order = $pickupRequest->loadMissing('order')->order;

        OrderStatusChanged::dispatch(
            $order,
            'pickup',
            (int) $pickupRequest->id,
            $previousStatus,
            $status,
        );

        return $pickupRequest;
    }
}
