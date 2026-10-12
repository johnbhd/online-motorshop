<?php

namespace App\Services;

use App\Models\OrderRequest;
use App\Models\Payment;

class CustomerPaymentActionResolver
{
    private const ELIGIBLE_ORDER_STATUSES = [
        'confirmed',
        'preparing',
        'preparing_order',
        'ready_for_pickup',
        'booked_for_delivery',
        'picked_up_by_rider',
    ];

    /**
     * @return array{
     *     can_view_instructions: bool,
     *     can_upload_proof: bool,
     *     can_reupload_proof: bool,
     *     can_view_submitted_proof: bool
     * }
     */
    public function resolve(OrderRequest $order, ?Payment $payment): array
    {
        $empty = [
            'can_view_instructions' => false,
            'can_upload_proof' => false,
            'can_reupload_proof' => false,
            'can_view_submitted_proof' => false,
        ];

        if (! $payment) {
            return $empty;
        }

        $method = strtolower(trim((string) $payment->payment_method));
        $status = strtolower(trim((string) $payment->payment_status));
        $orderStatus = strtolower(trim((string) $order->order_status));
        $isOnlinePayment = $method === Payment::METHOD_ONLINE_PAYMENT
            || str_contains($method, 'online');
        $isTerminalOrder = in_array($orderStatus, OrderRequest::TERMINAL_STATUSES, true);
        $isEligibleOrder = in_array($orderStatus, self::ELIGIBLE_ORDER_STATUSES, true);
        $isFailedProof = $status === Payment::STATUS_FAILED;
        $canSubmit = $isOnlinePayment
            && ! $isTerminalOrder
            && ($isFailedProof || ($status === Payment::STATUS_UNPAID && $isEligibleOrder));

        return [
            'can_view_instructions' => $canSubmit,
            'can_upload_proof' => $canSubmit,
            'can_reupload_proof' => $isFailedProof && $isOnlinePayment && ! $isTerminalOrder,
            'can_view_submitted_proof' => $status === Payment::STATUS_WAITING_FOR_VERIFICATION
                && filled($payment->proof_image_url),
        ];
    }
}
