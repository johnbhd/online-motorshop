<?php

namespace App\Services;

use App\Models\DeliveryRequest;
use App\Models\Message;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use App\Models\User;
use App\Notifications\CustomerNotification;

class CustomerNotificationService
{
    public function customerSignedIn(User $user): void
    {
        if ($user->role !== 'customer') {
            return;
        }

        $user->loadMissing('customer');

        $this->send($user, [
            'notification_type' => 'account_welcome',
            'category' => 'account',
            'title' => 'Welcome to ALD Motorshop',
            'message' => "Welcome to ALD Motorshop, {$user->name}. You can now browse products, submit order requests, and track your orders.",
            'reference' => ['type' => 'profile'],
            'event_key' => 'account:welcome',
        ]);

        $missingFields = $this->missingProfileFields($user);

        if ($missingFields === []) {
            return;
        }

        $labels = array_map(
            fn (string $field): string => $this->profileFieldLabel($field),
            $missingFields,
        );

        $this->send($user, [
            'notification_type' => 'profile_incomplete',
            'category' => 'account',
            'title' => 'Complete Your Profile',
            'message' => 'Please fill in your '.$this->joinList($labels).' in your profile. This helps make checkout and delivery details faster.',
            'reference' => ['type' => 'profile'],
            'event_key' => 'account:profile-incomplete:'.sha1(implode('|', $missingFields)),
        ]);
    }

    public function orderStatusChanged(
        OrderRequest $order,
        string $status,
        ?int $conversationId = null,
    ): void {
        $copy = match ($status) {
            'under_review' => ['type' => 'order_under_review', 'title' => 'Order Request Under Review', 'message' => "Your order request {$order->order_reference} is now under review by ALD Motorshop."],
            'confirmed' => ['type' => 'order_confirmed', 'title' => 'Order Request Confirmed', 'message' => "Your order request {$order->order_reference} has been confirmed by ALD Motorshop."],
            'rejected' => ['type' => 'order_rejected', 'title' => 'Order Request Rejected', 'message' => "Your order request {$order->order_reference} was not approved by ALD Motorshop."],
            'cancelled' => ['type' => 'order_cancelled', 'title' => 'Order Request Cancelled', 'message' => "Your order request {$order->order_reference} has been cancelled."],
            default => null,
        };

        if ($copy !== null) {
            $this->notifyOrder(
                $order,
                $copy['type'],
                $copy['title'],
                $copy['message'],
                $status,
                null,
                $conversationId,
            );
        }
    }

    public function paymentStatusChanged(Payment $payment, string $status): void
    {
        $copy = match ($status) {
            Payment::STATUS_PAID => ['type' => 'payment_verified', 'title' => 'Payment Verified', 'message' => 'Your payment for order :reference has been verified.'],
            Payment::STATUS_FAILED => ['type' => 'payment_rejected', 'title' => 'Payment Proof Needs Attention', 'message' => 'We could not verify your payment proof for order :reference. Please review your order details.'],
            default => null,
        };

        $order = $payment->loadMissing('order')->order;

        if ($copy === null || ! $order instanceof OrderRequest) {
            return;
        }

        $this->notifyOrder(
            $order,
            $copy['type'],
            $copy['title'],
            str_replace(':reference', $order->order_reference, $copy['message']),
            $status,
            "payment:{$payment->id}",
        );
    }

    public function pickupStatusChanged(
        PickupRequest $pickupRequest,
        string $status,
        ?int $conversationId = null,
    ): void {
        $copy = match ($status) {
            'preparing' => ['type' => 'order_preparing', 'title' => 'Order Preparing', 'message' => 'Your order :reference is now being prepared.'],
            'ready_for_pickup' => ['type' => 'ready_for_pickup', 'title' => 'Ready for Pickup', 'message' => 'Your order :reference is ready for pickup at :branch.'],
            'completed' => ['type' => 'pickup_completed', 'title' => 'Pickup Completed', 'message' => 'Your order :reference has been completed.'],
            default => null,
        };

        $order = $pickupRequest->loadMissing('order.branch')->order;

        if ($copy === null || ! $order instanceof OrderRequest) {
            return;
        }

        $message = str_replace(
            [':reference', ':branch'],
            [$order->order_reference, $order->branch?->name ?? 'your selected ALD branch'],
            $copy['message'],
        );

        $this->notifyOrder(
            $order,
            $copy['type'],
            $copy['title'],
            $message,
            $status,
            "pickup:{$pickupRequest->id}",
            $conversationId,
        );
    }

    public function deliveryStatusChanged(
        DeliveryRequest $deliveryRequest,
        string $status,
        ?int $conversationId = null,
    ): void {
        $copy = match ($status) {
            'booked' => ['type' => 'delivery_booked', 'title' => 'Delivery Booking Confirmed', 'message' => 'Delivery for order :reference has been booked.'],
            'picked_up', 'in_transit' => ['type' => 'delivery_in_transit', 'title' => 'Delivery In Transit', 'message' => 'Your order :reference is on the way.'],
            'delivered' => ['type' => 'delivery_delivered', 'title' => 'Order Delivered', 'message' => 'Your order :reference has been delivered.'],
            'failed' => ['type' => 'delivery_failed', 'title' => 'Delivery Update', 'message' => 'Delivery for order :reference needs attention.'],
            'cancelled' => ['type' => 'delivery_cancelled', 'title' => 'Delivery Cancelled', 'message' => 'Delivery for order :reference has been cancelled.'],
            default => null,
        };

        $order = $deliveryRequest->loadMissing('order')->order;

        if ($copy === null || ! $order instanceof OrderRequest) {
            return;
        }

        $this->notifyOrder(
            $order,
            $copy['type'],
            $copy['title'],
            str_replace(':reference', $order->order_reference, $copy['message']),
            $status,
            "delivery:{$deliveryRequest->id}",
            $conversationId,
        );
    }

    public function supportMessageReceived(Message $message): void
    {
        $conversation = $message->loadMissing('conversation.customer.user')->conversation;
        $user = $conversation?->customer?->user;

        if (! $user instanceof User || $user->role !== 'customer') {
            return;
        }

        $this->send($user, [
            'notification_type' => 'support_message_received',
            'category' => 'support',
            'title' => 'New Message from ALD Support',
            'message' => 'ALD Support replied to your conversation.',
            'reference' => ['type' => 'conversation', 'conversation_id' => $conversation->id],
            'event_key' => "support:message:{$message->id}",
        ]);
    }

    private function notifyOrder(
        OrderRequest $order,
        string $type,
        string $title,
        string $message,
        string $status,
        ?string $scope = null,
        ?int $conversationId = null,
    ): void {
        $order->loadMissing('customer.user');
        $user = $order->customer?->user;

        if (! $user instanceof User || $user->role !== 'customer') {
            return;
        }

        $reference = [
            'type' => 'order',
            'order_id' => $order->id,
            'order_reference' => $order->order_reference,
        ];

        if ($conversationId !== null) {
            $reference['conversation_id'] = $conversationId;
        }

        $this->send($user, [
            'notification_type' => $type,
            'category' => str_starts_with($type, 'payment_') ? 'payments' : 'orders',
            'title' => $title,
            'message' => $message,
            'reference' => $reference,
            'event_key' => $scope === null ? "order:{$order->id}:{$status}" : "{$scope}:{$status}",
        ]);
    }

    private function send(User $user, array $data): void
    {
        $eventKey = (string) $data['event_key'];
        $query = $user->notifications()
            ->where('type', CustomerNotification::class);

        if ($query->getModel()->getConnection()->getDriverName() === 'pgsql') {
            $duplicate = $query
                ->whereRaw("data::jsonb->>'event_key' = ?", [$eventKey])
                ->exists();
        } else {
            $duplicate = $query
                ->where('data->event_key', $eventKey)
                ->exists();
        }

        if (! $duplicate) {
            $user->notify(new CustomerNotification($data));
        }
    }

    private function missingProfileFields(User $user): array
    {
        $customer = $user->customer;
        $missing = [];

        if (blank($user->name)) {
            $missing[] = 'name';
        }

        if (blank($user->email)) {
            $missing[] = 'email';
        }

        if (blank($customer?->contact_number)) {
            $missing[] = 'contact_number';
        }

        if (blank($customer?->address)) {
            $missing[] = 'address';
        }

        if (blank($customer?->city) && blank($customer?->city_municipality_code)) {
            $missing[] = 'city';
        }

        if (blank($customer?->barangay) && blank($customer?->barangay_code)) {
            $missing[] = 'barangay';
        }

        return $missing;
    }

    private function profileFieldLabel(string $field): string
    {
        return match ($field) {
            'contact_number' => 'contact number',
            'city' => 'city or municipality',
            'barangay' => 'barangay',
            default => $field,
        };
    }

    private function joinList(array $items): string
    {
        $count = count($items);

        if ($count <= 1) {
            return $items[0] ?? 'your details';
        }

        if ($count === 2) {
            return $items[0].' and '.$items[1];
        }

        return implode(', ', array_slice($items, 0, -1)).' and '.$items[$count - 1];
    }
}
