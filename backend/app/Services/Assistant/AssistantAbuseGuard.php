<?php

namespace App\Services\Assistant;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class AssistantAbuseGuard
{
    private const MAX_REQUESTS_PER_MINUTE = 15;

    private const MAX_BURST_REQUESTS = 3;

    private const BURST_WINDOW_SECONDS = 5;

    private const DUPLICATE_WINDOW_SECONDS = 8;

    public function assertAllowed(Request $request, string $message): void
    {
        $identity = $this->identityFor($request);
        $duplicateKey = 'assistant:duplicate:'.$identity.':'.hash(
            'sha256',
            $this->normalizeMessage($message),
        );

        if (! Cache::add($duplicateKey, true, self::DUPLICATE_WINDOW_SECONDS)) {
            throw AssistantRateLimitException::duplicate();
        }

        try {
            $burstKey = 'assistant:burst:'.$identity;

            if (RateLimiter::tooManyAttempts($burstKey, self::MAX_BURST_REQUESTS)) {
                throw AssistantRateLimitException::burst(
                    RateLimiter::availableIn($burstKey),
                );
            }

            $minuteKey = 'assistant:minute:'.$identity;

            if (RateLimiter::tooManyAttempts($minuteKey, self::MAX_REQUESTS_PER_MINUTE)) {
                throw AssistantRateLimitException::perMinute(
                    RateLimiter::availableIn($minuteKey),
                );
            }

            RateLimiter::hit($burstKey, self::BURST_WINDOW_SECONDS);
            RateLimiter::hit($minuteKey, 60);
        } catch (AssistantRateLimitException $exception) {
            Cache::forget($duplicateKey);

            throw $exception;
        }
    }

    public function identityFor(Request $request): string
    {
        $user = $this->authenticatedUser();

        if ($user) {
            return 'user-'.hash('sha256', (string) $user->getAuthIdentifier());
        }

        $sessionId = trim((string) $request->header('X-Assistant-Session', ''));

        if (preg_match(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            $sessionId,
        ) === 1) {
            return 'session-'.hash('sha256', $sessionId);
        }

        return 'ip-'.hash('sha256', $request->ip() ?: 'unknown');
    }

    public function isAuthenticated(Request $request): bool
    {
        return $this->authenticatedUser() !== null;
    }

    private function authenticatedUser(): mixed
    {
        return Auth::guard('sanctum')->user();
    }

    private function normalizeMessage(string $message): string
    {
        $normalized = preg_replace('/\s+/u', ' ', trim($message)) ?? trim($message);

        return mb_strtolower($normalized, 'UTF-8');
    }
}
