<?php

namespace App\Services\Assistant;

use RuntimeException;

class AssistantUnavailableException extends RuntimeException
{
    public function __construct(
        public readonly string $publicMessage,
        public readonly string $reason,
    ) {
        parent::__construct($publicMessage);
    }

    public static function notConfigured(): self
    {
        return new self(
            'The ALD Assistant is not configured yet.',
            'not_configured',
        );
    }

    public static function unavailable(string $reason = 'upstream_unavailable'): self
    {
        return new self(
            'The ALD Assistant is temporarily unavailable. Please try again shortly.',
            $reason,
        );
    }
}
