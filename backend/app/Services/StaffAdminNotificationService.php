<?php

namespace App\Services;

use App\Models\Message;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\StaffAdminNotification;

class StaffAdminNotificationService
{
    public function orderCreated(OrderRequest $order): void
    {
        $order->loadMissing('branch');

        $this->notifyBranchAndAdmins($order->branch_id, [
            'notification_type' => 'order_request_created',
            'category' => 'orders',
            'title' => 'New Order Request',
            'message' => "Order request {$order->order_reference} is ready for review.",
            'reference' => $this->orderReference($order),
            'event_key' => "order:created:{$order->id}",
        ]);
    }

    public function orderAssigned(OrderRequest $order, ?int $staffId): void
    {
        if ($staffId === null) {
            return;
        }

        $staff = User::query()
            ->whereKey($staffId)
            ->where('role', 'staff')
            ->where('status', 'active')
            ->first();

        if (! $staff) {
            return;
        }

        $this->send($staff, [
            'notification_type' => 'order_assigned',
            'category' => 'assignments',
            'title' => 'Order Assigned to You',
            'message' => "Order request {$order->order_reference} was assigned to you.",
            'reference' => $this->orderReference($order),
            'event_key' => "order:assigned:{$order->id}:{$staff->id}",
        ]);
    }

    public function paymentProofSubmitted(Payment $payment): void
    {
        $payment->loadMissing('order');
        $order = $payment->order;

        if (! $order instanceof OrderRequest || $payment->payment_status !== Payment::STATUS_WAITING_FOR_VERIFICATION) {
            return;
        }

        $this->notifyBranchAndAdmins($order->branch_id, [
            'notification_type' => 'payment_proof_submitted',
            'category' => 'payments',
            'title' => 'Payment Proof Awaiting Review',
            'message' => "Payment proof for order {$order->order_reference} is ready for verification.",
            'reference' => $this->orderReference($order) + ['payment_id' => $payment->id],
            'event_key' => "payment:proof:{$payment->id}",
        ]);
    }

    public function deliveryReadyForBooking(Payment $payment, ?int $actorId = null): void
    {
        $payment->loadMissing('order.deliveryRequest');
        $order = $payment->order;

        if (! $order instanceof OrderRequest
            || $payment->payment_status !== Payment::STATUS_PAID
            || $order->deliveryRequest?->delivery_status !== 'waiting_for_booking') {
            return;
        }

        $this->notifyBranchAndAdmins($order->branch_id, [
            'notification_type' => 'delivery_ready_for_booking',
            'category' => 'delivery',
            'title' => 'Delivery Ready for Booking',
            'message' => "Order {$order->order_reference} has a verified payment and is ready for delivery booking.",
            'reference' => $this->orderReference($order) + ['payment_id' => $payment->id, 'delivery_id' => $order->deliveryRequest->id],
            'event_key' => "delivery:ready:{$order->deliveryRequest->id}:{$payment->id}",
        ], $actorId);
    }

    public function customerMessageReceived(Message $message): void
    {
        $message->loadMissing('conversation');

        $data = [
            'notification_type' => 'customer_message_received',
            'category' => 'messages',
            'title' => 'New Customer Message',
            'message' => 'A customer sent a new message to the support inbox.',
            'reference' => [
                'type' => 'conversation',
                'conversation_id' => $message->conversation_id,
            ],
            'event_key' => "conversation:message:{$message->id}",
        ];

        $this->sendToStaff(User::query()->where('status', 'active'), $data);
        $this->sendToAdmins(User::query(), $data);
    }

    private function notifyBranchAndAdmins(?int $branchId, array $data, ?int $excludeUserId = null): void
    {
        if ($branchId !== null) {
            $this->sendToStaff(User::query()->where('branch_id', $branchId), $data, $excludeUserId);
        }

        $this->sendToAdmins(User::query(), $data, $excludeUserId);
    }

    private function sendToStaff($query, array $data, ?int $excludeUserId = null): void
    {
        $query
            ->where('role', 'staff')
            ->where('status', 'active')
            ->when($excludeUserId !== null, fn ($builder) => $builder->whereKeyNot($excludeUserId))
            ->get()
            ->each(fn (User $user) => $this->send($user, $data));
    }

    private function sendToAdmins($query, array $data, ?int $excludeUserId = null): void
    {
        $query
            ->where('role', 'admin')
            ->where('status', 'active')
            ->when($excludeUserId !== null, fn ($builder) => $builder->whereKeyNot($excludeUserId))
            ->get()
            ->each(fn (User $user) => $this->send($user, $data));
    }

    private function send(User $user, array $data): void
    {
        $eventKey = (string) $data['event_key'];
        $duplicate = $user->notifications()
            ->where('type', StaffAdminNotification::class)
            ->where('data', 'like', '%"event_key":"'.addslashes($eventKey).'"%')
            ->exists();

        if (! $duplicate) {
            $user->notify(new StaffAdminNotification($data));
        }
    }

    private function orderReference(OrderRequest $order): array
    {
        return [
            'type' => 'order',
            'order_id' => $order->id,
            'order_reference' => $order->order_reference,
            'branch_id' => $order->branch_id,
        ];
    }
}
