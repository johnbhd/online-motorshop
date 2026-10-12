<?php

namespace App\Services\Assistant;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AssistantDailyQuotaGuard
{
    public function __construct(
        private readonly AssistantAbuseGuard $abuseGuard,
    ) {}

    public function assertAllowed(Request $request): void
    {
        if ($this->abuseGuard->isAuthenticated($request)) {
            return;
        }

        $limit = (int) config('assistant.guest_daily_limit', 50);

        if ($limit < 1) {
            throw AssistantRateLimitException::daily();
        }

        $key = $this->cacheKey($request);

        if (RateLimiter::tooManyAttempts($key, $limit)) {
            throw AssistantRateLimitException::daily();
        }

        RateLimiter::hit($key, $this->secondsUntilTomorrow());
    }

    private function cacheKey(Request $request): string
    {
        $prefix = trim((string) config('assistant.daily_cache_prefix', 'assistant:daily'));

        return $prefix.':'.$this->abuseGuard->identityFor($request).':'.now()->toDateString();
    }

    private function secondsUntilTomorrow(): int
    {
        return max(1, (int) now()->diffInSeconds(now()->copy()->addDay()->startOfDay()));
    }
}
