<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\CompleteGoogleRegistrationRequest;
use App\Http\Requests\Auth\ExchangeGoogleAuthCodeRequest;
use App\Http\Requests\Auth\LinkGoogleAccountRequest;
use App\Models\User;
use App\Services\Auth\AuthResponseService;
use App\Services\Auth\GoogleAuthException;
use App\Services\Auth\GoogleAuthStateService;
use App\Services\Auth\GoogleOAuthService;
use App\Services\CustomerNotificationService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class GoogleAuthController extends Controller
{
    public function __construct(
        private readonly GoogleOAuthService $googleOAuthService,
        private readonly GoogleAuthStateService $stateService,
        private readonly AuthResponseService $authResponseService,
        private readonly CustomerNotificationService $customerNotificationService,
    ) {}

    public function redirect(Request $request): RedirectResponse
    {
        $returnTo = $this->validatedReturnTo($request->query('return_to'));
        $state = $this->stateService->create(
            'oauth-state',
            ['return_to' => $returnTo],
            (int) config('services.google.state_ttl', 600),
        );

        try {
            $authorizationUrl = $this->googleOAuthService->authorizationUrl($state['token']);
        } catch (GoogleAuthException $exception) {
            Log::warning('Google OAuth redirect could not be created.', [
                'code' => $exception->errorCode,
            ]);

            return $this->errorRedirect($returnTo, $exception->errorCode);
        }

        return redirect()->away($authorizationUrl);
    }

    public function callback(Request $request): RedirectResponse
    {
        $state = (string) $request->query('state', '');
        $statePayload = $this->stateService->consume(
            'oauth-state',
            $state,
            static fn (array $payload): array => $payload,
        );

        if (! is_array($statePayload)) {
            return $this->errorRedirect('/', 'google_state_invalid');
        }

        $returnTo = $this->validatedReturnTo($statePayload['return_to'] ?? null);
        $providerError = (string) $request->query('error', '');

        if ($providerError !== '') {
            Log::info('Google OAuth was cancelled or rejected by the provider.', [
                'cancelled' => $providerError === 'access_denied',
            ]);

            return $this->errorRedirect(
                $returnTo,
                $providerError === 'access_denied'
                    ? 'google_cancelled'
                    : 'google_auth_failed',
            );
        }

        $code = (string) $request->query('code', '');

        if ($code === '') {
            return $this->errorRedirect($returnTo, 'google_auth_failed');
        }

        try {
            $identity = $this->googleOAuthService->identityFromAuthorizationCode($code);

            return $this->resolveIdentity($identity, $returnTo);
        } catch (GoogleAuthException $exception) {
            Log::warning('Google OAuth callback could not be completed.', [
                'code' => $exception->errorCode,
            ]);

            return $this->errorRedirect($returnTo, $exception->errorCode);
        }
    }

    public function setup(string $token): JsonResponse
    {
        $payload = $this->stateService->get('setup', $token);

        if ($payload === null) {
            return $this->errorResponse(
                'google_setup_expired',
                'The Google registration setup has expired. Please start again.',
            );
        }

        return response()->json([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'expiresAt' => $payload['expires_at'],
            'return_to' => $payload['return_to'],
        ]);
    }

    public function complete(CompleteGoogleRegistrationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $user = $this->stateService->consume(
                'setup',
                $validated['setup_token'],
                function (array $payload) use ($validated): User {
                    try {
                        return DB::transaction(function () use ($payload, $validated): User {
                            $googleId = (string) $payload['google_id'];
                            $email = (string) $payload['email'];

                            $existingGoogleUser = User::query()
                                ->where('google_id', $googleId)
                                ->lockForUpdate()
                                ->first();

                            $existingEmailUser = User::query()
                                ->whereRaw('LOWER(email) = ?', [$email])
                                ->lockForUpdate()
                                ->first();

                            if ($existingGoogleUser !== null || $existingEmailUser !== null) {
                                throw new GoogleAuthException('google_identity_conflict');
                            }

                            $user = User::create([
                                'name' => $validated['full_name'],
                                'email' => $email,
                                'password' => $validated['password'],
                                'google_id' => $googleId,
                                'branch_id' => null,
                                'status' => 'active',
                                'role' => 'customer',
                            ]);

                            $user->customer()->create([
                                'full_name' => $validated['full_name'],
                                'contact_number' => $validated['phone'],
                                'email' => $email,
                            ]);

                            return $user->load('customer');
                        });
                    } catch (QueryException $exception) {
                        throw new GoogleAuthException('google_identity_conflict');
                    }
                },
            );
        } catch (GoogleAuthException $exception) {
            return $this->errorResponse(
                $exception->errorCode,
                $this->messageFor($exception->errorCode),
            );
        }

        if (! $user instanceof User) {
            return $this->errorResponse(
                'google_setup_expired',
                'The Google registration setup has expired. Please start again.',
            );
        }

        $this->customerNotificationService->customerSignedIn($user);

        return response()->json(
            $this->authResponseService->issueToken($user, 'Google registration successful.'),
            201,
        );
    }

    public function linkProfile(string $token): JsonResponse
    {
        $payload = $this->stateService->get('link', $token);

        if ($payload === null) {
            return $this->errorResponse(
                'google_link_expired',
                'The Google account-link request has expired. Please start again.',
            );
        }

        return response()->json([
            'email' => $payload['email'],
            'expiresAt' => $payload['expires_at'],
            'return_to' => $payload['return_to'],
        ]);
    }

    public function link(LinkGoogleAccountRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $result = $this->stateService->consume(
                'link',
                $validated['link_token'],
                function (array $payload) use ($validated): array {
                    $user = User::query()->find($payload['user_id']);

                    if (! $user instanceof User || $user->role !== 'customer') {
                        throw new GoogleAuthException('google_customer_only');
                    }

                    if ($user->status !== 'active') {
                        throw new GoogleAuthException('google_account_inactive');
                    }

                    if (! Hash::check($validated['password'], $user->password)) {
                        throw ValidationException::withMessages([
                            'password' => ['The existing ALD password is incorrect.'],
                        ]);
                    }

                    $providerUser = User::query()
                        ->where('google_id', $payload['google_id'])
                        ->whereKeyNot($user->getKey())
                        ->exists();

                    if ($providerUser) {
                        throw new GoogleAuthException('google_identity_conflict');
                    }

                    if ($user->google_id !== null && $user->google_id !== $payload['google_id']) {
                        throw new GoogleAuthException('google_identity_conflict');
                    }

                    $user->forceFill([
                        'google_id' => $payload['google_id'],
                    ])->save();

                    $user->load('customer');

                    return [
                        'user' => $user,
                        'return_to' => $payload['return_to'],
                    ];
                },
            );
        } catch (ValidationException $exception) {
            return response()->json([
                'code' => 'google_link_invalid',
                'message' => 'The existing ALD password is incorrect.',
                'errors' => $exception->errors(),
            ], 422);
        } catch (GoogleAuthException $exception) {
            return $this->errorResponse(
                $exception->errorCode,
                $this->messageFor($exception->errorCode),
            );
        }

        if (! is_array($result) || ! ($result['user'] ?? null) instanceof User) {
            return $this->errorResponse(
                'google_link_expired',
                'The Google account-link request has expired. Please start again.',
            );
        }

        $user = $result['user'];
        $this->customerNotificationService->customerSignedIn($user);

        return response()->json(
            array_merge(
                $this->authResponseService->issueToken($user, 'Google account linked successfully.'),
                ['return_to' => $result['return_to']],
            ),
        );
    }

    public function exchange(ExchangeGoogleAuthCodeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $result = $this->stateService->consume(
                'handoff',
                $validated['code'],
                function (array $payload): array {
                    $user = User::query()->with('customer')->find($payload['user_id']);

                    if (! $user instanceof User || $user->role !== 'customer' || $user->status !== 'active') {
                        throw new GoogleAuthException('google_handoff_invalid');
                    }

                    return [
                        'auth' => $this->authResponseService->issueToken(
                            $user,
                            'Google authentication successful.',
                        ),
                        'return_to' => $payload['return_to'],
                        'user' => $user,
                    ];
                },
            );
        } catch (GoogleAuthException $exception) {
            return $this->errorResponse(
                $exception->errorCode,
                $this->messageFor($exception->errorCode),
            );
        }

        if (! is_array($result) || ! isset($result['auth'])) {
            return $this->errorResponse(
                'google_handoff_invalid',
                'The Google sign-in handoff is invalid or expired. Please start again.',
            );
        }

        if (($result['user'] ?? null) instanceof User) {
            $this->customerNotificationService->customerSignedIn($result['user']);
        }

        return response()->json(array_merge(
            $result['auth'],
            ['return_to' => $result['return_to']],
        ));
    }

    private function resolveIdentity(array $identity, string $returnTo): RedirectResponse
    {
        $googleId = (string) $identity['google_id'];
        $email = (string) $identity['email'];
        $linkedUser = User::query()->where('google_id', $googleId)->first();
        $emailUser = User::query()
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        if ($linkedUser !== null) {
            if ($emailUser !== null && $emailUser->getKey() !== $linkedUser->getKey()) {
                throw new GoogleAuthException('google_identity_conflict');
            }

            $this->ensureActiveCustomer($linkedUser);
            $handoff = $this->stateService->create(
                'handoff',
                [
                    'user_id' => $linkedUser->getKey(),
                    'return_to' => $returnTo,
                ],
                (int) config('services.google.handoff_ttl', 300),
            );

            return $this->frontendRedirect('/auth/google/callback', [
                'code' => $handoff['token'],
                'return_to' => $returnTo,
            ]);
        }

        if ($emailUser !== null) {
            if ($emailUser->role !== 'customer') {
                throw new GoogleAuthException('google_customer_only');
            }

            if ($emailUser->google_id !== null) {
                throw new GoogleAuthException('google_identity_conflict');
            }

            $this->ensureActiveCustomer($emailUser);
            $link = $this->stateService->create(
                'link',
                [
                    'user_id' => $emailUser->getKey(),
                    'google_id' => $googleId,
                    'email' => $email,
                    'return_to' => $returnTo,
                ],
                (int) config('services.google.link_ttl', 900),
            );

            return $this->frontendRedirect('/auth/google/link', [
                'token' => $link['token'],
                'return_to' => $returnTo,
            ]);
        }

        $setup = $this->stateService->create(
            'setup',
            [
                'google_id' => $googleId,
                'email' => $email,
                'name' => $identity['name'],
                'return_to' => $returnTo,
            ],
            (int) config('services.google.setup_ttl', 900),
        );

        return $this->frontendRedirect('/register/google/complete', [
            'token' => $setup['token'],
            'return_to' => $returnTo,
        ]);
    }

    private function ensureActiveCustomer(User $user): void
    {
        if ($user->role !== 'customer') {
            throw new GoogleAuthException('google_customer_only');
        }

        if ($user->status !== 'active') {
            throw new GoogleAuthException('google_account_inactive');
        }
    }

    private function validatedReturnTo(mixed $returnTo): string
    {
        $allowed = [
            '/',
            '/checkout',
            '/account/orders',
        ];

        return is_string($returnTo) && in_array($returnTo, $allowed, true)
            ? $returnTo
            : '/';
    }

    private function frontendRedirect(string $path, array $query): RedirectResponse
    {
        $frontendUrl = trim((string) config('services.frontend.url'));

        if ($frontendUrl === '') {
            Log::error('Google OAuth frontend redirect URL is not configured.');

            abort(503, 'Google authentication is not configured.');
        }

        $url = rtrim($frontendUrl, '/')
            .$path;

        if ($query !== []) {
            $url .= '?'.http_build_query($query, '', '&', PHP_QUERY_RFC3986);
        }

        return redirect()->away($url);
    }

    private function errorRedirect(string $returnTo, string $code): RedirectResponse
    {
        return $this->frontendRedirect('/auth/google/callback', [
            'error' => $code,
            'return_to' => $this->validatedReturnTo($returnTo),
        ]);
    }

    private function errorResponse(string $code, string $message): JsonResponse
    {
        return response()->json([
            'code' => $code,
            'message' => $message,
        ], 422);
    }

    private function messageFor(string $code): string
    {
        return match ($code) {
            'google_customer_only' => 'Google sign-in is only available for customer accounts.',
            'google_account_inactive' => 'This customer account is not active.',
            'google_identity_conflict' => 'This Google account cannot be linked to the requested ALD account.',
            'google_link_expired' => 'The Google account-link request has expired. Please start again.',
            'google_handoff_invalid' => 'The Google sign-in handoff is invalid or expired. Please start again.',
            'google_email_unverified' => 'Google did not provide a verified email address.',
            default => 'Google authentication could not be completed.',
        };
    }
}
