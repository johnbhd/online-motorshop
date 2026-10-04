<?php

namespace App\Services;

use App\Models\Conversation;
use App\Models\Message;

class ConversationPresenter
{
    public function details(Conversation $conversation): array
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
                ->map(fn (Message $message): array => $this->message($message))
                ->values()
                ->all(),
        ];
    }

    public function summary(Conversation $conversation): array
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
            'last_message' => $latestMessage ? $this->message($latestMessage) : null,
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

    private function message(Message $message): array
    {
        return [
            'id' => $message->id,
            'sender' => $message->sender_type,
            'body' => $message->body,
            'created_at' => $message->created_at?->toISOString(),
        ];
    }
}
