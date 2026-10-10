<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class StaffPaymentStatusService
{
    public function __construct(
        private readonly CustomerNotificationService $customerNotificationService,
        private readonly StaffAdminNotificationService $staffAdminNotificationService,
    ) {}

    private const TRANSITIONS = [
        'waiting_for_verification' => [
            'paid',
            'failed',
        ],
    ];

    public function allowedStatuses(Payment $payment): array
    {
        return self::TRANSITIONS[$payment->payment_status] ?? [];
    }

    public function transition(
        Payment $payment,
        string $status,
        User $reviewer,
    ): Payment {
        if (! in_array($status, $this->allowedStatuses($payment), true)) {
            throw ValidationException::withMessages([
                'status' => [
                    "Payment status cannot change from {$payment->payment_status} to {$status}.",
                ],
            ]);
        }

        $payment = DB::transaction(function () use ($payment, $reviewer, $status): Payment {
            $payment->update([
                'payment_status' => $status,
                'verified_by' => $reviewer->id,
                'verified_at' => now(),
            ]);

            return $payment->fresh();
        });

        $this->customerNotificationService->paymentStatusChanged($payment, $status);

        if ($status === Payment::STATUS_PAID) {
            $this->staffAdminNotificationService->deliveryReadyForBooking($payment, $reviewer->id);
        }

        return $payment;
    }
}
