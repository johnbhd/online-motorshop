<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Message;
use App\Models\OrderRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ConversationService
{
    public function __construct(
        private readonly CustomerNotificationService $customerNotificationService,
        private readonly StaffAdminNotificationService $staffAdminNotificationService,
        private readonly MediaAssetService $mediaAssetService,
    ) {}

    public function findCurrent(?User $user, ?string $guestToken): ?Conversation
    {
        $query = Conversation::query();

        if ($user?->customer) {
            $query->where('customer_id', $user->customer->id);
        } elseif ($guestToken !== null && trim($guestToken) !== '') {
            $query->where('guest_token_hash', $this->hashGuestToken($guestToken));
        } else {
            return null;
        }

        return $this->loadConversation($query->where('status', 'open')->first());
    }

    public function findOrCreateForOrder(OrderRequest $order): ?Conversation
    {
        $order->loadMissing('customer.user');
        $customer = $order->customer;

        if ($customer?->user?->role === 'customer') {
            [$conversation] = $this->findOrCreateForCustomer($customer);

            return $conversation;
        }

        if (blank($order->guest_token_hash)) {
            return null;
        }

        [$conversation] = $this->findOrCreateForGuestHash($order->guest_token_hash);

        return $conversation;
    }

    /**
     * Append an automated order update without notifying staff as if a human
     * customer had sent the message.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function appendAutomatedOrderUpdate(
        Conversation $conversation,
        string $body,
        array $metadata,
        string $eventKey,
    ): Message {
        return $this->appendMessage(
            $conversation,
            'system',
            $body,
            null,
            'order_update',
            $metadata,
            null,
            null,
            $eventKey,
        );
    }

    /**
     * Mark inbound conversation messages and matching customer notifications
     * read after the authorized customer or guest opens the thread.
     *
     * @return array{messages: int, notifications: int}
     */
    public function markCustomerMessagesRead(
        Conversation $conversation,
        ?User $user,
    ): array {
        $readMessages = $conversation->messages()
            ->whereIn('sender_type', ['staff', 'admin', 'system'])
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        $readNotifications = 0;

        if ($user?->role === 'customer') {
            $query = $user->notifications()
                ->whereNull('read_at')
                ->where(function ($notificationQuery) use ($conversation): void {
                    $driver = $notificationQuery->getModel()->getConnection()->getDriverName();

                    if ($driver === 'pgsql') {
                        $notificationQuery->whereRaw(
                            "data::jsonb->'reference'->>'conversation_id' = ?",
                            [(string) $conversation->id],
                        );

                        return;
                    }

                    $notificationQuery->where('data', 'like', '%"conversation_id":'.$conversation->id.'%');
                });

            $readNotifications = $query->update(['read_at' => now()]);
        }

        return [
            'messages' => $readMessages,
            'notifications' => $readNotifications,
        ];
    }

    /**
     * @return array{conversation: Conversation, created: bool, guest_token: string|null}
     */
    public function start(
        ?User $user,
        ?string $guestToken,
        string $body,
        string $messageType = 'text',
        ?array $metadata = null,
        ?array $attachment = null,
    ): array {
        $customer = $user?->customer;
        $created = false;
        $rawGuestToken = null;

        if ($customer instanceof Customer) {
            [$conversation, $created] = $this->findOrCreateForCustomer($customer);
        } else {
            $rawGuestToken = trim((string) $guestToken);
            if ($rawGuestToken === '') {
                $rawGuestToken = bin2hex(random_bytes(32));
            }

            [$conversation, $created] = $this->findOrCreateForGuest($rawGuestToken);
        }

        $this->appendCustomerMessage(
            $conversation,
            $user,
            $body,
            $messageType,
            $metadata,
            $attachment,
        );

        return [
            'conversation' => $this->loadConversation($conversation),
            'created' => $created,
            'guest_token' => $customer instanceof Customer ? null : $rawGuestToken,
        ];
    }

    public function appendCustomerMessage(
        Conversation $conversation,
        ?User $user,
        string $body,
        string $messageType = 'text',
        ?array $metadata = null,
        ?array $attachment = null,
    ): Message {
        $message = $this->appendMessage(
            $conversation,
            'customer',
            $body,
            $user?->id,
            $messageType,
            $metadata,
            $attachment,
            $user,
        );
        $this->staffAdminNotificationService->customerMessageReceived($message);

        return $message;
    }

    public function appendStaffMessage(
        Conversation $conversation,
        User $staff,
        string $body,
    ): Message {
        $message = $this->appendMessage(
            $conversation,
            'staff',
            $body,
            $staff->id,
            'text',
            null,
            null,
            $staff,
        );
        $this->customerNotificationService->supportMessageReceived($message);

        return $message;
    }

    public function appendAdminMessage(
        Conversation $conversation,
        User $admin,
        string $body,
    ): Message {
        $message = $this->appendMessage(
            $conversation,
            'admin',
            $body,
            $admin->id,
            'text',
            null,
            null,
            $admin,
        );
        $this->customerNotificationService->supportMessageReceived($message);

        return $message;
    }

    public function loadConversation(?Conversation $conversation, bool $includeSenderUsers = false): ?Conversation
    {
        if (! $conversation) {
            return null;
        }

        $relations = [
            'customer.user',
            'messages' => fn ($query) => $query->orderBy('id'),
            'latestMessage',
        ];

        if ($includeSenderUsers) {
            $relations['messages.senderUser'] = fn ($query) => $query->select(['id', 'name']);
            $relations['latestMessage.senderUser'] = fn ($query) => $query->select(['id', 'name']);
        }

        return $conversation->load($relations);
    }

    private function appendMessage(
        Conversation $conversation,
        string $senderType,
        string $body,
        ?int $senderUserId,
        string $messageType = 'text',
        ?array $metadata = null,
        ?array $attachment = null,
        ?User $actor = null,
        ?string $eventKey = null,
    ): Message {
        return DB::transaction(function () use (
            $conversation,
            $senderType,
            $body,
            $senderUserId,
            $messageType,
            $metadata,
            $attachment,
            $actor,
            $eventKey,
        ): Message {
            $lockedConversation = Conversation::query()
                ->lockForUpdate()
                ->findOrFail($conversation->id);

            abort_unless($lockedConversation->status === 'open', 409, 'This conversation is not open.');

            if ($eventKey !== null) {
                $existingMessage = Message::query()
                    ->where('event_key', $eventKey)
                    ->first();

                if ($existingMessage) {
                    return $existingMessage;
                }
            }

            $message = $lockedConversation->messages()->create([
                'sender_type' => $senderType,
                'sender_user_id' => $senderUserId,
                'body' => trim($body),
                'message_type' => $messageType,
                'metadata' => $metadata,
                'attachment_url' => $attachment['secure_url'] ?? null,
                'attachment_public_id' => $attachment['public_id'] ?? null,
                'event_key' => $eventKey,
            ]);

            if ($attachment) {
                $this->mediaAssetService->registerUploadedAsset(
                    $attachment,
                    $messageType === 'contact_inquiry'
                        ? 'contact_inquiry_attachment'
                        : 'message_attachment',
                    'message',
                    (int) $message->id,
                    $actor,
                );
            }

            $lockedConversation->forceFill([
                'last_message_at' => $message->created_at,
            ])->save();

            return $message;
        });
    }

    /** @return array{Conversation, bool} */
    private function findOrCreateForCustomer(Customer $customer): array
    {
        $conversation = Conversation::query()->firstOrCreate([
            'customer_id' => $customer->id,
        ], [
            'participant_type' => 'customer',
            'status' => 'open',
        ]);

        return [$conversation, $conversation->wasRecentlyCreated];
    }

    /** @return array{Conversation, bool} */
    private function findOrCreateForGuest(string $guestToken): array
    {
        return $this->findOrCreateForGuestHash($this->hashGuestToken($guestToken));
    }

    /** @return array{Conversation, bool} */
    private function findOrCreateForGuestHash(string $guestTokenHash): array
    {
        $conversation = Conversation::query()->firstOrCreate([
            'guest_token_hash' => $guestTokenHash,
        ], [
            'participant_type' => 'guest',
            'status' => 'open',
        ]);

        return [$conversation, $conversation->wasRecentlyCreated];
    }

    private function hashGuestToken(string $guestToken): string
    {
        return hash('sha256', $guestToken);
    }
}
