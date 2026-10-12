<?php

namespace App\Services;

use App\Events\OrderStatusChanged;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\PickupRequest;

class OrderCommunicationService
{
    public function __construct(
        private readonly ConversationService $conversationService,
        private readonly CustomerNotificationService $customerNotificationService,
    ) {}

    public function handle(OrderStatusChanged $event): void
    {
        if ($event->previousStatus === $event->status) {
            return;
        }

        $copy = $this->messageCopy($event->source, $event->status, $event->order);

        if ($copy === null) {
            return;
        }

        $order = $event->order->fresh() ?? $event->order;
        $conversation = $this->conversationService->findOrCreateForOrder($order);

        if ($conversation === null) {
            return;
        }

        $message = $this->conversationService->appendAutomatedOrderUpdate(
            $conversation,
            $copy['message'],
            [
                'event_key' => $event->eventKey,
                'source' => $event->source,
                'status' => $event->status,
                'order_id' => $order->id,
                'order_reference' => $order->order_reference,
            ],
            $event->eventKey,
        );

        $this->notifyCustomer($event, $order, $message->conversation_id);
    }

    /**
     * @return array{message: string}|null
     */
    private function messageCopy(
        string $source,
        string $status,
        OrderRequest $order,
    ): ?array {
        $reference = $order->order_reference;

        return match ($source) {
            'order' => match ($status) {
                'pending' => [
                    'message' => "Your order request {$reference} is pending review by ALD Motorshop.",
                ],
                'under_review' => [
                    'message' => "Your order request {$reference} is now under review by ALD Motorshop.",
                ],
                'confirmed' => [
                    'message' => "Your order request {$reference} has been confirmed by ALD Motorshop.",
                ],
                'rejected' => [
                    'message' => "Your order request {$reference} was not approved by ALD Motorshop.",
                ],
                'cancelled' => [
                    'message' => "Your order request {$reference} has been cancelled.",
                ],
                'completed' => [
                    'message' => "Your order {$reference} has been marked as completed.",
                ],
                default => null,
            },
            'pickup' => match ($status) {
                'pending' => [
                    'message' => "Pickup for order {$reference} is pending processing.",
                ],
                'preparing' => [
                    'message' => "Your order {$reference} is now being prepared.",
                ],
                'ready_for_pickup' => [
                    'message' => "Your order {$reference} is ready for pickup. Please follow the confirmed pickup instructions.",
                ],
                'completed' => [
                    'message' => "Your order {$reference} has been completed.",
                ],
                'cancelled' => [
                    'message' => "Pickup for order {$reference} has been cancelled.",
                ],
                default => null,
            },
            'delivery' => match ($status) {
                'waiting_for_booking' => [
                    'message' => "Delivery for order {$reference} is waiting for manual booking.",
                ],
                'booked' => [
                    'message' => "Delivery for order {$reference} has been booked.",
                ],
                'picked_up' => [
                    'message' => "Your order {$reference} has been picked up by the rider.",
                ],
                'in_transit' => [
                    'message' => "Your order {$reference} is on the way.",
                ],
                'delivered' => [
                    'message' => "Your order {$reference} has been delivered.",
                ],
                'failed' => [
                    'message' => "Delivery for order {$reference} needs attention. ALD staff will contact you with the next steps.",
                ],
                'cancelled' => [
                    'message' => "Delivery for order {$reference} has been cancelled.",
                ],
                default => null,
            },
            default => null,
        };
    }

    private function notifyCustomer(
        OrderStatusChanged $event,
        OrderRequest $order,
        int $conversationId,
    ): void {
        if ($event->source === 'order') {
            $this->customerNotificationService->orderStatusChanged(
                $order,
                $event->status,
                $conversationId,
                $event->eventKeySuffix,
            );

            return;
        }

        if ($event->source === 'pickup') {
            $pickupRequest = $order->loadMissing('pickupRequest')->pickupRequest;

            if ($pickupRequest instanceof PickupRequest) {
                $this->customerNotificationService->pickupStatusChanged(
                    $pickupRequest,
                    $event->status,
                    $conversationId,
                    $event->eventKeySuffix,
                );
            }

            return;
        }

        if ($event->source === 'delivery') {
            $deliveryRequest = $order->loadMissing('deliveryRequest')->deliveryRequest;

            if ($deliveryRequest instanceof DeliveryRequest) {
                $this->customerNotificationService->deliveryStatusChanged(
                    $deliveryRequest,
                    $event->status,
                    $conversationId,
                    $event->eventKeySuffix,
                );
            }
        }
    }
}
