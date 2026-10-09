<?php

namespace App\Services;

use App\Models\PickupRequest;
use Illuminate\Validation\ValidationException;

class StaffPickupStatusService
{
    public function __construct(
        private readonly CustomerNotificationService $customerNotificationService,
    ) {}

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

        $pickupRequest->update([
            'pickup_status' => $status,
            'completed_at' => $status === 'completed'
                ? now()
                : $pickupRequest->completed_at,
        ]);

        $pickupRequest = $pickupRequest->fresh();
        $this->customerNotificationService->pickupStatusChanged($pickupRequest, $status);

        return $pickupRequest;
    }
}
