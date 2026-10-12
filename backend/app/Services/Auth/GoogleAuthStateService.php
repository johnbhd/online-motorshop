<?php

namespace App\Services\Auth;

use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Support\Facades\Cache;

class GoogleAuthStateService
{
    public function create(string $type, array $payload, int $ttl): array
    {
        $token = bin2hex(random_bytes(32));
        $expiresAt = CarbonImmutable::now()->addSeconds(max(1, $ttl));

        $payload['expires_at'] = $expiresAt->toIso8601String();

        Cache::put(
            $this->key($type, $token),
            $payload,
            max(1, $ttl),
        );

        return [
            'token' => $token,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    public function get(string $type, string $token): ?array
    {
        $key = $this->key($type, $token);
        $payload = Cache::get($key);

        if (! is_array($payload)) {
            return null;
        }

        if ($this->isExpired($payload)) {
            Cache::forget($key);

            return null;
        }

        return $payload;
    }

    public function consume(string $type, string $token, Closure $callback): mixed
    {
        if ($token === '') {
            return null;
        }

        $key = $this->key($type, $token);

        return Cache::lock($this->lockKey($key), 10)->block(1, function () use ($key, $callback): mixed {
            $payload = Cache::get($key);

            if (! is_array($payload)) {
                return null;
            }

            if ($this->isExpired($payload)) {
                Cache::forget($key);

                return null;
            }

            $result = $callback($payload);
            Cache::forget($key);

            return $result;
        });
    }

    public function forget(string $type, string $token): void
    {
        Cache::forget($this->key($type, $token));
    }

    private function key(string $type, string $token): string
    {
        return 'google-auth:'.$type.':'.hash('sha256', $token);
    }

    private function lockKey(string $key): string
    {
        return $key.':lock';
    }

    private function isExpired(array $payload): bool
    {
        $expiresAt = $payload['expires_at'] ?? null;

        return ! is_string($expiresAt) || CarbonImmutable::parse($expiresAt)->isPast();
    }
}
