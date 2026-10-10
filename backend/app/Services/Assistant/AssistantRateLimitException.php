<?php

namespace App\Services\Assistant;

use RuntimeException;

class AssistantRateLimitException extends RuntimeException
{
    public readonly int $retryAfter;

    public function __construct(
        public readonly string $publicMessage,
        public readonly string $errorCode,
        int $retryAfter,
    ) {
        $this->retryAfter = max(1, $retryAfter);

        parent::__construct($publicMessage);
    }

    public static function duplicate(): self
    {
        return new self(
            'That message was already sent. Please wait a moment before sending it again.',
            'duplicate_message',
            8,
        );
    }

    public static function burst(int $retryAfter): self
    {
        return new self(
            'Too many messages were sent in a short period. Please wait a few seconds and try again.',
            'assistant_burst_limited',
            $retryAfter,
        );
    }

    public static function perMinute(int $retryAfter): self
    {
        return new self(
            'Too many messages were sent in a short period. Please wait a few seconds and try again.',
            'assistant_rate_limited',
            $retryAfter,
        );
    }
}
