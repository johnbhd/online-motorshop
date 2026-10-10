<?php

namespace App\Services;

use App\Models\OrderRequest;
use Illuminate\Validation\ValidationException;

class StaffOrderStatusService
{
    public function __construct(
        private readonly CustomerNotificationService $customerNotificationService,
    ) {}

    private const ALLOWED_TRANSITIONS = [
        'pending' => [
            'under_review',
            'rejected',
        ],
        'under_review' => [
            'confirmed',
            'rejected',
        ],
    ];

    public function allowedStatuses(OrderRequest $order): array
    {
        return self::ALLOWED_TRANSITIONS[$order->order_status] ?? [];
    }

    public function transition(OrderRequest $order, string $targetStatus): OrderRequest
    {
        if (! in_array($targetStatus, $this->allowedStatuses($order), true)) {
            throw ValidationException::withMessages([
                'status' => [
                    sprintf(
                        'The order cannot transition from %s to %s.',
                        $order->order_status,
                        $targetStatus,
                    ),
                ],
            ]);
        }

        $order->update([
            'order_status' => $targetStatus,
        ]);

        $order = $order->fresh();
        $this->customerNotificationService->orderStatusChanged($order, $targetStatus);

        return $order;
    }
}
