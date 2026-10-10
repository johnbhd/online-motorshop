<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;

class ConversationPresenter
{
    public function details(Conversation $conversation): array
    {
        return $this->presentDetails($conversation, false);
    }

    public function detailsForAdmin(Conversation $conversation): array
    {
        return $this->presentDetails($conversation, true);
    }

    private function presentDetails(Conversation $conversation, bool $includeSenderNames): array
    {
        return [
            'id' => $conversation->id,
            'participant_type' => $conversation->participant_type,
            'participant' => $this->participant($conversation),
            'status' => $conversation->status,
            'created_at' => $conversation->created_at?->toISOString(),
            'updated_at' => $conversation->updated_at?->toISOString(),
            'last_message_at' => $conversation->last_message_at?->toISOString(),
            'messages' => $conversation->messages
                ->map(fn (Message $message): array => $this->message($message, $includeSenderNames))
                ->values()
                ->all(),
        ];
    }

    public function summary(Conversation $conversation): array
    {
        return $this->presentSummary($conversation, false);
    }

    public function summaryForAdmin(Conversation $conversation): array
    {
        return $this->presentSummary($conversation, true);
    }

    private function presentSummary(Conversation $conversation, bool $includeSenderNames): array
    {
        $latestMessage = $conversation->latestMessage;

        return [
            'id' => $conversation->id,
            'participant_type' => $conversation->participant_type,
            'participant' => $this->participant($conversation),
            'status' => $conversation->status,
            'created_at' => $conversation->created_at?->toISOString(),
            'updated_at' => $conversation->updated_at?->toISOString(),
            'last_message_at' => $conversation->last_message_at?->toISOString(),
            'message_count' => $conversation->messages_count ?? $conversation->messages()->count(),
            'last_message' => $latestMessage ? $this->message($latestMessage, $includeSenderNames) : null,
        ];
    }

    private function participant(Conversation $conversation): array
    {
        $customer = $conversation->customer;

        if (! $customer) {
            return [
                'id' => null,
                'name' => 'Guest Customer',
                'email' => null,
            ];
        }

        return [
            'id' => $customer->id,
            'name' => $customer->full_name,
            'email' => $customer->email ?: $customer->user?->email,
        ];
    }

    private function message(Message $message, bool $includeSenderName = false): array
    {
        $payload = [
            'id' => $message->id,
            'sender' => $message->sender_type,
            'body' => $message->body,
            'message_type' => $message->message_type ?? 'text',
            'metadata' => $message->metadata,
            'attachment' => $message->attachment_url
                ? ['url' => $message->attachment_url]
                : null,
            'created_at' => $message->created_at?->toISOString(),
        ];

        if ($includeSenderName) {
            $payload['sender_name'] = $message->senderUser?->name;
        }

        return $payload;
    }
}
