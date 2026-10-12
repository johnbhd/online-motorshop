<?php

namespace App\Services;

use App\Models\OrderRequest;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;

class OrderTrackingAuthorizationService
{
    /**
     * Issue a short-lived bearer token scoped to one already-verified order.
     *
     * @return array{token: string, expires_at: string}
     */
    public function issue(OrderRequest $order): array
    {
        $token = bin2hex(random_bytes(32));
        $expiresAt = CarbonImmutable::now()->addSeconds($this->ttl());

        Cache::put($this->key($token), [
            'order_id' => (int) $order->id,
            'reference' => strtolower(trim((string) $order->order_reference)),
            'expires_at' => $expiresAt->getTimestamp(),
        ], $expiresAt);

        return [
            'token' => $token,
            'expires_at' => $expiresAt->toIso8601String(),
        ];
    }

    public function allows(?string $token, OrderRequest $order): bool
    {
        $token = trim((string) $token);

        if ($token === '') {
            return false;
        }

        $payload = Cache::get($this->key($token));

        if (! is_array($payload)) {
            return false;
        }

        $expiresAt = (int) ($payload['expires_at'] ?? 0);

        if ($expiresAt < CarbonImmutable::now()->getTimestamp()) {
            Cache::forget($this->key($token));

            return false;
        }

        return (int) ($payload['order_id'] ?? 0) === (int) $order->id
            && ($payload['reference'] ?? null) === strtolower(trim((string) $order->order_reference));
    }

    public function ttl(): int
    {
        return max(60, (int) config('services.order_tracking.ttl', 900));
    }

    private function key(string $token): string
    {
        return 'order-tracking:'.hash('sha256', $token);
    }
}
