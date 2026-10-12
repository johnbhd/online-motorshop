<?php

namespace App\Services;

use App\Events\OrderStatusChanged;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AdminStatusOverrideService
{
    private const ORDER_OVERRIDE_STATUSES = [
        'pending',
        'under_review',
        'confirmed',
        'rejected',
        'cancelled',
    ];

    private const PICKUP_ACTIVE_STATUSES = [
        'preparing',
        'ready_for_pickup',
        'completed',
    ];

    private const DELIVERY_ACTIVE_STATUSES = [
        'booked',
        'picked_up',
        'in_transit',
        'delivered',
    ];

    public function __construct(
        private readonly AdminAuditLogService $auditLogs,
        private readonly StaffOrderStatusService $orderStatusService,
        private readonly StaffPickupStatusService $pickupStatusService,
        private readonly StaffDeliveryStatusService $deliveryStatusService,
        private readonly StaffPaymentStatusService $paymentStatusService,
        private readonly CustomerNotificationService $customerNotificationService,
        private readonly StaffAdminNotificationService $staffAdminNotificationService,
    ) {}

    /** @return array<int, string> */
    public function orderAllowedStatuses(OrderRequest $order): array
    {
        return array_values(array_diff(self::ORDER_OVERRIDE_STATUSES, [(string) $order->order_status]));
    }

    /** @return array<int, string> */
    public function pickupAllowedStatuses(PickupRequest $pickupRequest): array
    {
        return array_values(array_diff(PickupRequest::STATUS_VALUES, [(string) $pickupRequest->pickup_status]));
    }

    /** @return array<int, string> */
    public function deliveryAllowedStatuses(DeliveryRequest $deliveryRequest): array
    {
        return array_values(array_diff(DeliveryRequest::STATUS_VALUES, [(string) $deliveryRequest->delivery_status]));
    }

    /** @return array<int, string> */
    public function paymentAllowedStatuses(Payment $payment): array
    {
        return array_values(array_diff(Payment::STATUS_VALUES, [(string) $payment->payment_status]));
    }

    public function order(
        OrderRequest $order,
        string $status,
        ?string $reason,
        User $admin,
    ): OrderRequest {
        [$order, $auditId, $previousStatus] = DB::transaction(function () use ($order, $status, $reason, $admin): array {
            $record = OrderRequest::query()
                ->lockForUpdate()
                ->with(['pickupRequest:id,order_id,pickup_status', 'deliveryRequest:id,order_id,delivery_status'])
                ->findOrFail($order->id);

            $this->assertStatus($status, self::ORDER_OVERRIDE_STATUSES, 'order');

            if ($record->order_status === $status) {
                throw ValidationException::withMessages([
                    'status' => ['The order already has this status.'],
                ]);
            }

            $forwardStatuses = $this->orderStatusService->allowedStatuses($record);
            $reason = $this->normalizedReason(
                $reason,
                ! in_array($status, $forwardStatuses, true),
                'A reason is required for an Admin order status correction.',
            );

            $this->assertOrderDependency($record, $status);

            $previousStatus = (string) $record->order_status;
            $record->update(['order_status' => $status]);
            $record = $record->fresh();
            $audit = $this->auditLogs->record(
                $admin,
                'status_override',
                'order',
                (int) $record->id,
                (string) $record->order_reference,
                $previousStatus,
                $status,
                $reason,
                ['fulfillment_type' => $record->fulfillment_type],
            );

            return [$record, (int) $audit->id, $previousStatus];
        });

        OrderStatusChanged::dispatch(
            $order,
            'order',
            (int) $order->id,
            $previousStatus,
            (string) $order->order_status,
            "admin-override:{$auditId}",
        );

        return $order;
    }

    public function pickup(
        PickupRequest $pickupRequest,
        string $status,
        ?string $reason,
        User $admin,
    ): PickupRequest {
        [$pickupRequest, $auditId, $previousStatus] = DB::transaction(function () use ($pickupRequest, $status, $reason, $admin): array {
            $record = PickupRequest::query()
                ->lockForUpdate()
                ->with('order:id,order_reference,order_status,fulfillment_type')
                ->findOrFail($pickupRequest->id);

            $this->assertStatus($status, PickupRequest::STATUS_VALUES, 'pickup');

            if ($record->pickup_status === $status) {
                throw ValidationException::withMessages([
                    'status' => ['The pickup request already has this status.'],
                ]);
            }

            $forwardStatuses = $this->pickupStatusService->allowedStatuses($record);
            $reason = $this->normalizedReason(
                $reason,
                ! in_array($status, $forwardStatuses, true),
                'A reason is required for an Admin pickup status correction.',
            );

            $order = $record->order;

            if (
                in_array($status, self::PICKUP_ACTIVE_STATUSES, true)
                && $order?->order_status !== 'confirmed'
            ) {
                throw new HttpException(
                    409,
                    'The parent order must be confirmed before pickup can progress. Roll back the pickup to Pending or correct the order first.',
                );
            }

            $previousStatus = (string) $record->pickup_status;
            $record->update([
                'pickup_status' => $status,
                'completed_at' => $status === 'completed' ? now() : null,
            ]);
            $record = $record->fresh();
            $audit = $this->auditLogs->record(
                $admin,
                'status_override',
                'pickup',
                (int) $record->id,
                $order?->order_reference,
                $previousStatus,
                $status,
                $reason,
                ['order_id' => $record->order_id],
            );

            return [$record, (int) $audit->id, $previousStatus];
        });

        $pickupRequest->loadMissing('order');
        OrderStatusChanged::dispatch(
            $pickupRequest->order,
            'pickup',
            (int) $pickupRequest->id,
            $previousStatus,
            (string) $pickupRequest->pickup_status,
            "admin-override:{$auditId}",
        );

        return $pickupRequest;
    }

    /** @param array<string, mixed> $attributes */
    public function delivery(
        DeliveryRequest $deliveryRequest,
        string $status,
        array $attributes,
        ?string $reason,
        User $admin,
    ): DeliveryRequest {
        [$deliveryRequest, $auditId, $previousStatus] = DB::transaction(function () use ($deliveryRequest, $status, $attributes, $reason, $admin): array {
            $record = DeliveryRequest::query()
                ->lockForUpdate()
                ->with('order:id,order_reference,order_status,fulfillment_type')
                ->findOrFail($deliveryRequest->id);

            $this->assertStatus($status, DeliveryRequest::STATUS_VALUES, 'delivery');

            if ($record->delivery_status === $status) {
                throw ValidationException::withMessages([
                    'status' => ['The delivery request already has this status.'],
                ]);
            }

            $forwardStatuses = $this->deliveryStatusService->allowedStatuses($record);
            $reason = $this->normalizedReason(
                $reason,
                ! in_array($status, $forwardStatuses, true),
                'A reason is required for an Admin delivery status correction.',
            );

            $order = $record->order;
            $progressStatuses = ['booked', 'picked_up', 'in_transit', 'delivered'];

            if (in_array($status, $progressStatuses, true) && $order?->order_status !== 'confirmed') {
                throw new HttpException(
                    409,
                    'The parent order must be confirmed before delivery can progress. Correct the order status first.',
                );
            }

            if (
                in_array($status, $progressStatuses, true)
                && blank($attributes['booking_reference'] ?? $record->booking_reference)
            ) {
                throw ValidationException::withMessages([
                    'booking_reference' => ['A booking reference is required for this delivery status.'],
                ]);
            }

            if ($status === 'booked' && ! $this->hasPaidLatestPayment($record)) {
                throw ValidationException::withMessages([
                    'status' => ['The latest payment must be verified before the delivery can be marked as booked.'],
                ]);
            }

            $previousStatus = (string) $record->delivery_status;
            $record->update([
                ...array_intersect_key(
                    $attributes,
                    array_flip([
                        'booking_reference',
                        'tracking_url',
                        'rider_name',
                        'rider_contact',
                        'vehicle_plate',
                        'remarks',
                    ]),
                ),
                'delivery_status' => $status,
                'delivered_at' => $status === 'delivered' ? now() : null,
            ]);
            $record = $record->fresh();
            $audit = $this->auditLogs->record(
                $admin,
                'status_override',
                'delivery',
                (int) $record->id,
                $order?->order_reference,
                $previousStatus,
                $status,
                $reason,
                ['order_id' => $record->order_id],
            );

            return [$record, (int) $audit->id, $previousStatus];
        });

        $deliveryRequest->loadMissing('order');
        OrderStatusChanged::dispatch(
            $deliveryRequest->order,
            'delivery',
            (int) $deliveryRequest->id,
            $previousStatus,
            (string) $deliveryRequest->delivery_status,
            "admin-override:{$auditId}",
        );

        return $deliveryRequest;
    }

    public function payment(
        Payment $payment,
        string $status,
        ?string $reason,
        User $admin,
    ): Payment {
        [$payment, $auditId] = DB::transaction(function () use ($payment, $status, $reason, $admin): array {
            $record = Payment::query()
                ->lockForUpdate()
                ->with('order:id,order_reference')
                ->findOrFail($payment->id);

            $this->assertStatus($status, Payment::STATUS_VALUES, 'payment');

            if ($record->payment_status === $status) {
                throw ValidationException::withMessages([
                    'status' => ['The payment already has this status.'],
                ]);
            }

            $forwardStatuses = $this->paymentStatusService->allowedStatuses($record);
            $requiresReason = ! in_array($status, $forwardStatuses, true)
                || ($record->payment_status === Payment::STATUS_PAID && $status !== Payment::STATUS_PAID);
            $reason = $this->normalizedReason(
                $reason,
                $requiresReason,
                'A reason is required for an Admin payment status correction.',
            );

            $previousStatus = (string) $record->payment_status;
            $record->update([
                'payment_status' => $status,
                'verified_by' => $admin->id,
                'verified_at' => now(),
            ]);
            $record = $record->fresh();
            $audit = $this->auditLogs->record(
                $admin,
                'status_override',
                'payment',
                (int) $record->id,
                $record->payment_reference ?: 'Payment #'.$record->id,
                $previousStatus,
                $status,
                $reason,
                ['order_id' => $record->order_id],
            );

            return [$record, (int) $audit->id];
        });

        $payment->loadMissing('order');
        $this->customerNotificationService->paymentStatusChanged(
            $payment,
            $status,
            "admin-override:{$auditId}",
        );

        if ($status === Payment::STATUS_PAID) {
            $this->staffAdminNotificationService->deliveryReadyForBooking($payment, $admin->id);
        }

        return $payment;
    }

    /** @param array<int, string> $statuses */
    private function assertStatus(string $status, array $statuses, string $recordType): void
    {
        if (! in_array($status, $statuses, true)) {
            throw ValidationException::withMessages([
                'status' => ["The {$recordType} status is not supported by the Admin correction workflow."],
            ]);
        }
    }

    private function normalizedReason(?string $reason, bool $required, string $message): string
    {
        $reason = trim((string) $reason);

        if ($required && $reason === '') {
            throw ValidationException::withMessages(['reason' => [$message]]);
        }

        return $reason !== '' ? $reason : 'Admin status update recorded from the Admin console.';
    }

    private function assertOrderDependency(OrderRequest $order, string $status): void
    {
        if ($status === 'confirmed') {
            return;
        }

        $pickupStatus = $order->pickupRequest?->pickup_status;
        $deliveryStatus = $order->deliveryRequest?->delivery_status;

        if (
            in_array($pickupStatus, self::PICKUP_ACTIVE_STATUSES, true)
            || in_array($deliveryStatus, self::DELIVERY_ACTIVE_STATUSES, true)
        ) {
            throw new HttpException(
                409,
                'Correct the active pickup or delivery status before moving this order out of Confirmed. Historical fulfillment state is preserved.',
            );
        }
    }

    private function hasPaidLatestPayment(DeliveryRequest $deliveryRequest): bool
    {
        return Payment::query()
            ->where('order_id', $deliveryRequest->order_id)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->value('payment_status') === Payment::STATUS_PAID;
    }
}
