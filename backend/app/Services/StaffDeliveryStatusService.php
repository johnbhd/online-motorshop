<?php

namespace App\Services;

use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\Payment;
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
        $statuses = self::TRANSITIONS[$deliveryRequest->delivery_status] ?? [];
        $orderStatus = OrderRequest::query()
            ->whereKey($deliveryRequest->order_id)
            ->value('order_status');

        if (in_array($orderStatus, OrderRequest::TERMINAL_STATUSES, true)) {
            return array_values(array_intersect($statuses, ['cancelled']));
        }

        if (
            $deliveryRequest->delivery_status === 'waiting_for_booking'
            && ! $this->hasPaidLatestPayment($deliveryRequest)
        ) {
            return array_values(array_filter($statuses, fn (string $status): bool => $status !== 'booked'));
        }

        return $statuses;
    }

    public function transition(
        DeliveryRequest $deliveryRequest,
        string $status,
        array $attributes = [],
    ): DeliveryRequest {
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
            $delivery = DeliveryRequest::query()
                ->lockForUpdate()
                ->findOrFail($deliveryRequest->id);
            $validTransitions = self::TRANSITIONS[$delivery->delivery_status] ?? [];

            if (! in_array($status, $validTransitions, true)) {
                throw ValidationException::withMessages([
                    'status' => [
                        "Delivery status cannot change from {$delivery->delivery_status} to {$status}.",
                    ],
                ]);
            }

            $order = OrderRequest::query()
                ->lockForUpdate()
                ->findOrFail($delivery->order_id);

            if (
                in_array($order->order_status, OrderRequest::TERMINAL_STATUSES, true)
                && $status !== 'cancelled'
            ) {
                throw ValidationException::withMessages([
                    'status' => [
                        'A delivery linked to a completed, rejected, or cancelled order cannot progress.',
                    ],
                ]);
            }

            if (
                $status === 'booked'
                && blank($allowedAttributes['booking_reference'] ?? $delivery->booking_reference)
            ) {
                throw ValidationException::withMessages([
                    'booking_reference' => [
                        'A manual Lalamove booking reference is required before marking delivery as booked.',
                    ],
                ]);
            }

            if ($status === 'booked' && ! $this->hasPaidLatestPayment($delivery, lock: true)) {
                throw ValidationException::withMessages([
                    'status' => [
                        'The latest payment must be verified before the delivery can be marked as booked.',
                    ],
                ]);
            }

            $delivery->update([
                ...$allowedAttributes,
                'delivery_status' => $status,
                'delivered_at' => $status === 'delivered'
                    ? now()
                    : $delivery->delivered_at,
            ]);

            return $delivery->fresh();
        });
    }

    private function hasPaidLatestPayment(DeliveryRequest $deliveryRequest, bool $lock = false): bool
    {
        $query = Payment::query()
            ->where('order_id', $deliveryRequest->order_id)
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($lock) {
            $query->lockForUpdate();
        }

        return $query->value('payment_status') === Payment::STATUS_PAID;
    }
}
