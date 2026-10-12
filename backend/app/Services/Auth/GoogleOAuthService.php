<?php

namespace App\Services\Auth;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class GoogleOAuthService
{
    public function authorizationUrl(string $state): string
    {
        $clientId = (string) config('services.google.client_id');

        if ($clientId === '') {
            throw new GoogleAuthException('google_auth_failed');
        }

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => config('services.google.redirect'),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'access_type' => 'online',
            'include_granted_scopes' => 'true',
            'prompt' => 'select_account',
        ], '', '&', PHP_QUERY_RFC3986);

        return (string) config('services.google.authorization_url').'?'.$query;
    }

    public function identityFromAuthorizationCode(string $code): array
    {
        $clientId = (string) config('services.google.client_id');
        $clientSecret = (string) config('services.google.client_secret');

        if ($clientId === '' || $clientSecret === '') {
            throw new GoogleAuthException('google_auth_failed');
        }

        try {
            $tokenResponse = Http::asForm()
                ->timeout($this->timeout())
                ->post((string) config('services.google.token_url'), [
                    'code' => $code,
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'redirect_uri' => config('services.google.redirect'),
                    'grant_type' => 'authorization_code',
                ]);
        } catch (Throwable $exception) {
            $this->logProviderFailure($exception);

            throw new GoogleAuthException('google_auth_failed');
        }

        if (! $tokenResponse->successful()) {
            Log::warning('Google OAuth token exchange was rejected.', [
                'status' => $tokenResponse->status(),
            ]);

            throw new GoogleAuthException('google_auth_failed');
        }

        $accessToken = $tokenResponse->json('access_token');

        if (! is_string($accessToken) || $accessToken === '') {
            Log::warning('Google OAuth token response did not contain an access token.');

            throw new GoogleAuthException('google_auth_failed');
        }

        try {
            $profileResponse = Http::withToken($accessToken)
                ->timeout($this->timeout())
                ->get((string) config('services.google.userinfo_url'));
        } catch (Throwable $exception) {
            $this->logProviderFailure($exception);

            throw new GoogleAuthException('google_auth_failed');
        }

        if (! $profileResponse->successful()) {
            Log::warning('Google userinfo request was rejected.', [
                'status' => $profileResponse->status(),
            ]);

            throw new GoogleAuthException('google_auth_failed');
        }

        $profile = $profileResponse->json();
        $email = is_array($profile) && is_string($profile['email'] ?? null)
            ? mb_strtolower(trim($profile['email']))
            : '';
        $googleId = is_array($profile) && is_string($profile['sub'] ?? null)
            ? trim($profile['sub'])
            : '';

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new GoogleAuthException('google_auth_failed');
        }

        if ($googleId === '') {
            throw new GoogleAuthException('google_auth_failed');
        }

        if (! filter_var($profile['email_verified'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            throw new GoogleAuthException('google_email_unverified');
        }

        $name = is_array($profile) && is_string($profile['name'] ?? null)
            ? trim($profile['name'])
            : '';

        return [
            'google_id' => $googleId,
            'email' => $email,
            'name' => $name !== '' ? $name : strstr($email, '@', true),
        ];
    }

    private function timeout(): int
    {
        return max(1, (int) config('services.google.timeout', 10));
    }

    private function logProviderFailure(Throwable $exception): void
    {
        Log::warning('Google OAuth provider request failed.', [
            'exception' => $exception::class,
        ]);
    }
}
