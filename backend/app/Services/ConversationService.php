<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ConversationService
{
    public function __construct(
        private readonly CustomerNotificationService $customerNotificationService,
        private readonly StaffAdminNotificationService $staffAdminNotificationService,
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
        );
        $this->staffAdminNotificationService->customerMessageReceived($message);

        return $message;
    }

    public function appendStaffMessage(
        Conversation $conversation,
        User $staff,
        string $body,
    ): Message {
        $message = $this->appendMessage($conversation, 'staff', $body, $staff->id);
        $this->customerNotificationService->supportMessageReceived($message);

        return $message;
    }

    public function appendAdminMessage(
        Conversation $conversation,
        User $admin,
        string $body,
    ): Message {
        $message = $this->appendMessage($conversation, 'admin', $body, $admin->id);
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
    ): Message {
        return DB::transaction(function () use (
            $conversation,
            $senderType,
            $body,
            $senderUserId,
            $messageType,
            $metadata,
            $attachment,
        ): Message {
            $lockedConversation = Conversation::query()
                ->lockForUpdate()
                ->findOrFail($conversation->id);

            abort_unless($lockedConversation->status === 'open', 409, 'This conversation is not open.');

            $message = $lockedConversation->messages()->create([
                'sender_type' => $senderType,
                'sender_user_id' => $senderUserId,
                'body' => trim($body),
                'message_type' => $messageType,
                'metadata' => $metadata,
                'attachment_url' => $attachment['secure_url'] ?? null,
                'attachment_public_id' => $attachment['public_id'] ?? null,
            ]);

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
        $conversation = Conversation::query()->firstOrCreate([
            'guest_token_hash' => $this->hashGuestToken($guestToken),
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
