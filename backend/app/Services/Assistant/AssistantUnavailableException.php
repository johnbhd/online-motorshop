<?php

namespace App\Services\Assistant;

use RuntimeException;

class AssistantUnavailableException extends RuntimeException
{
    public function __construct(
        public readonly string $publicMessage,
        public readonly string $reason,
        public readonly ?int $retryAfter = null,
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
        $publicMessage = match ($reason) {
            'catalog_unavailable' => 'I am having trouble accessing the current ALD catalog right now. Please try again or talk to ALD Staff.',
            'provider_rate_limited' => 'ALD Assistant is briefly busy. Please wait a few seconds and try again.',
            default => 'The ALD Assistant is temporarily unavailable. Please try again shortly.',
        };

        return new self(
            $publicMessage,
            $reason,
            $reason === 'provider_rate_limited' ? 6 : null,
        );
    }
}
