<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleAuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');
        $app['config']->set('cache.default', 'array');
        $app['config']->set('services.google.client_id', 'google-client-id');
        $app['config']->set('services.google.client_secret', 'google-client-secret');
        $app['config']->set('services.google.redirect', 'http://localhost/api/auth/google/callback');
        $app['config']->set('services.google.authorization_url', 'https://accounts.google.com/o/oauth2/v2/auth');
        $app['config']->set('services.google.token_url', 'https://oauth2.googleapis.com/token');
        $app['config']->set('services.google.userinfo_url', 'https://openidconnect.googleapis.com/v1/userinfo');
        $app['config']->set('services.frontend.url', 'http://localhost:3000');

        return $app;
    }

    public function test_google_redirect_contains_configured_callback_scope_and_state(): void
    {
        $query = $this->startGoogle('/checkout');

        $this->assertSame('google-client-id', $query['client_id']);
        $this->assertSame('http://localhost/api/auth/google/callback', $query['redirect_uri']);
        $this->assertSame('openid email profile', $query['scope']);
        $this->assertSame('code', $query['response_type']);
        $this->assertNotEmpty($query['state']);
    }

    public function test_invalid_missing_expired_and_reused_oauth_state_are_rejected(): void
    {
        $this->getJson('/api/auth/google/callback?state=missing&code=provider-code')
            ->assertRedirectContains('google_state_invalid');

        $query = $this->startGoogle();
        $this->get('/api/auth/google/callback?'.http_build_query([
            'state' => $query['state'],
            'error' => 'access_denied',
        ]))->assertRedirectContains('google_cancelled');

        $this->get('/api/auth/google/callback?'.http_build_query([
            'state' => $query['state'],
            'code' => 'provider-code',
        ]))->assertRedirectContains('google_state_invalid');

        $expiredQuery = $this->startGoogle();
        $issuedAt = CarbonImmutable::now();
        CarbonImmutable::setTestNow($issuedAt->addMinutes(11));

        try {
            $this->get('/api/auth/google/callback?'.http_build_query([
                'state' => $expiredQuery['state'],
                'code' => 'provider-code',
            ]))->assertRedirectContains('google_state_invalid');
        } finally {
            CarbonImmutable::setTestNow();
        }
    }

    public function test_provider_cancellation_and_failure_use_safe_error_codes(): void
    {
        $cancelled = $this->startGoogle();

        $this->get('/api/auth/google/callback?'.http_build_query([
            'state' => $cancelled['state'],
            'error' => 'access_denied',
        ]))->assertRedirectContains('google_cancelled');

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response(['error' => 'invalid_grant'], 400),
        ]);

        $failed = $this->startGoogle();

        $this->get('/api/auth/google/callback?'.http_build_query([
            'state' => $failed['state'],
            'code' => 'provider-code',
        ]))->assertRedirectContains('google_auth_failed');
    }

    public function test_new_google_customer_can_complete_registration_and_use_password_login(): void
    {
        $this->fakeGoogleIdentity([
            'sub' => 'google-new-customer',
            'email' => 'newcustomer@example.com',
            'email_verified' => true,
            'name' => 'Google New Customer',
        ]);

        $redirect = $this->completeGoogleCallback();
        $setup = $this->redirectQuery($redirect);

        $this->assertStringContainsString('/register/google/complete', $setup['location']);
        $this->assertSame(0, User::query()->count());

        $this->getJson('/api/auth/google/setup/'.$setup['query']['token'])
            ->assertOk()
            ->assertJsonPath('name', 'Google New Customer')
            ->assertJsonPath('email', 'newcustomer@example.com')
            ->assertJsonMissingPath('google_id')
            ->assertJsonMissingPath('sub');

        $completion = $this->postJson('/api/auth/google/complete', [
            'setup_token' => $setup['query']['token'],
            'full_name' => 'Edited Google Customer',
            'phone' => '09171234567',
            'password' => 'secure-password',
            'password_confirmation' => 'secure-password',
        ])
            ->assertCreated()
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonPath('user.email', 'newcustomer@example.com')
            ->assertJsonPath('user.customer.full_name', 'Edited Google Customer');

        $user = User::query()->where('email', 'newcustomer@example.com')->firstOrFail();

        $this->assertSame('google-new-customer', $user->google_id);
        $this->assertTrue(Hash::check('secure-password', $user->password));
        $this->assertNotEmpty($completion->json('token'));
        $this->assertDatabaseHas('customers', [
            'user_id' => $user->id,
            'contact_number' => '09171234567',
        ]);

        $this->getJson('/api/auth/google/setup/'.$setup['query']['token'])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'google_setup_expired');

        $this->postJson('/api/auth/login', [
            'email' => 'newcustomer@example.com',
            'password' => 'secure-password',
        ])->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_google_completion_rejects_invalid_registration_input_without_creating_a_user(): void
    {
        $this->fakeGoogleIdentity([
            'sub' => 'google-invalid-registration',
            'email' => 'invalid-registration@example.com',
            'email_verified' => true,
            'name' => 'Invalid Registration',
        ]);

        $setup = $this->redirectQuery($this->completeGoogleCallback());

        $this->postJson('/api/auth/google/complete', [
            'setup_token' => $setup['query']['token'],
            'full_name' => '',
            'phone' => '',
            'password' => 'short',
            'password_confirmation' => 'different',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['full_name', 'phone', 'password']);

        $this->assertDatabaseMissing('users', [
            'email' => 'invalid-registration@example.com',
        ]);
    }

    public function test_existing_google_customer_gets_a_single_use_handoff(): void
    {
        $user = $this->createCustomerUser(
            'linked@example.com',
            'Existing Google Customer',
            'google-existing',
        );

        $this->fakeGoogleIdentity([
            'sub' => 'google-existing',
            'email' => 'linked@example.com',
            'email_verified' => true,
            'name' => 'Existing Google Customer',
        ]);

        $handoff = $this->redirectQuery($this->completeGoogleCallback('/account/orders'));

        $this->assertStringContainsString('/auth/google/callback', $handoff['location']);
        $this->assertSame(1, User::query()->count());

        $this->postJson('/api/auth/google/exchange', [
            'code' => $handoff['query']['code'],
        ])->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('return_to', '/account/orders');

        $this->postJson('/api/auth/google/exchange', [
            'code' => $handoff['query']['code'],
        ])->assertUnprocessable()
            ->assertJsonPath('code', 'google_handoff_invalid');
    }

    public function test_existing_customer_must_verify_password_before_google_linking(): void
    {
        $user = $this->createCustomerUser('password-customer@example.com', 'Password Customer');

        $this->fakeGoogleIdentity([
            'sub' => 'google-link-customer',
            'email' => 'password-customer@example.com',
            'email_verified' => true,
            'name' => 'Password Customer',
        ]);

        $link = $this->redirectQuery($this->completeGoogleCallback());

        $this->getJson('/api/auth/google/link/'.$link['query']['token'])
            ->assertOk()
            ->assertJsonPath('email', 'password-customer@example.com')
            ->assertJsonMissingPath('user_id')
            ->assertJsonMissingPath('google_id');

        $this->postJson('/api/auth/google/link', [
            'link_token' => $link['query']['token'],
            'password' => 'wrong-password',
        ])->assertUnprocessable()
            ->assertJsonPath('code', 'google_link_invalid');

        $this->assertNull($user->fresh()->google_id);

        $this->postJson('/api/auth/google/link', [
            'link_token' => $link['query']['token'],
            'password' => 'password',
        ])->assertOk()
            ->assertJsonPath('user.id', $user->id);

        $this->assertSame('google-link-customer', $user->fresh()->google_id);
        $this->assertTrue(Hash::check('password', $user->fresh()->password));

        Cache::flush();

        $this->postJson('/api/auth/google/link', [
            'link_token' => $link['query']['token'],
            'password' => 'password',
        ])->assertUnprocessable()
            ->assertJsonPath('code', 'google_link_expired');

        $this->postJson('/api/auth/login', [
            'email' => 'password-customer@example.com',
            'password' => 'password',
        ])->assertOk()->assertJsonPath('user.id', $user->id);
    }

    public function test_admin_and_staff_google_accounts_are_blocked_without_modification(): void
    {
        foreach (['admin', 'staff'] as $role) {
            $email = $role.'-google@example.com';
            $user = User::create([
                'name' => ucfirst($role).' User',
                'email' => $email,
                'password' => 'password',
                'role' => $role,
                'status' => 'active',
                'branch_id' => null,
            ]);

            $this->fakeGoogleIdentity([
                'sub' => 'google-'.$role,
                'email' => $email,
                'email_verified' => true,
                'name' => ucfirst($role).' User',
            ]);

            $redirect = $this->redirectQuery($this->completeGoogleCallback());

            $this->assertStringContainsString('google_customer_only', $redirect['location']);
            $this->assertNull($user->fresh()->google_id);
        }
    }

    public function test_guest_customer_email_is_not_silently_claimed(): void
    {
        $guest = Customer::create([
            'user_id' => null,
            'full_name' => 'Guest Customer',
            'contact_number' => '09179999999',
            'email' => 'guest-google@example.com',
        ]);

        $this->fakeGoogleIdentity([
            'sub' => 'google-guest-collision',
            'email' => 'guest-google@example.com',
            'email_verified' => true,
            'name' => 'Guest Google',
        ]);

        $setup = $this->redirectQuery($this->completeGoogleCallback());

        $this->assertStringContainsString('/register/google/complete', $setup['location']);
        $this->assertNull($guest->fresh()->user_id);
        $this->assertSame(0, User::query()->count());
    }

    public function test_unverified_google_email_is_rejected(): void
    {
        $this->fakeGoogleIdentity([
            'sub' => 'google-unverified',
            'email' => 'unverified@example.com',
            'email_verified' => false,
            'name' => 'Unverified User',
        ]);

        $unverified = $this->redirectQuery($this->completeGoogleCallback());

        $this->assertStringContainsString('google_email_unverified', $unverified['location']);
        $this->assertSame(0, User::query()->count());
    }

    public function test_google_identity_conflict_is_rejected(): void
    {
        $this->createCustomerUser('different@example.com', 'Different Customer', 'google-owner');
        $conflictUser = $this->createCustomerUser('conflict@example.com', 'Conflict Customer');

        $this->fakeGoogleIdentity([
            'sub' => 'google-owner',
            'email' => 'conflict@example.com',
            'email_verified' => true,
            'name' => 'Conflict Customer',
        ]);

        $conflict = $this->redirectQuery($this->completeGoogleCallback());

        $this->assertStringContainsString('google_identity_conflict', $conflict['location']);
        $this->assertNull($conflictUser->fresh()->google_id);
    }

    public function test_setup_token_expires_without_creating_an_account(): void
    {
        $this->app['config']->set('services.google.setup_ttl', 60);
        $this->fakeGoogleIdentity([
            'sub' => 'google-expired-setup',
            'email' => 'expired-setup@example.com',
            'email_verified' => true,
            'name' => 'Expired Setup',
        ]);

        $setup = $this->redirectQuery($this->completeGoogleCallback());
        $issuedAt = CarbonImmutable::now();
        CarbonImmutable::setTestNow($issuedAt->addSeconds(61));

        try {
            $this->getJson('/api/auth/google/setup/'.$setup['query']['token'])
                ->assertUnprocessable()
                ->assertJsonPath('code', 'google_setup_expired');
            $this->assertDatabaseMissing('users', ['email' => 'expired-setup@example.com']);
        } finally {
            CarbonImmutable::setTestNow();
        }
    }

    public function test_google_registration_rolls_back_when_customer_creation_fails(): void
    {
        $this->fakeGoogleIdentity([
            'sub' => 'google-rollback',
            'email' => 'rollback@example.com',
            'email_verified' => true,
            'name' => 'Rollback Customer',
        ]);

        $setup = $this->redirectQuery($this->completeGoogleCallback());
        $shouldFail = true;

        DB::listen(function (QueryExecuted $query) use (&$shouldFail): void {
            if ($shouldFail && str_contains(strtolower($query->sql), 'insert into "customers"')) {
                $shouldFail = false;
                throw new \RuntimeException('Simulated customer creation failure.');
            }
        });

        $this->postJson('/api/auth/google/complete', [
            'setup_token' => $setup['query']['token'],
            'full_name' => 'Rollback Customer',
            'phone' => '09171111111',
            'password' => 'secure-password',
            'password_confirmation' => 'secure-password',
        ])->assertServerError();

        $this->assertDatabaseMissing('users', ['email' => 'rollback@example.com']);
        $this->assertDatabaseMissing('customers', ['email' => 'rollback@example.com']);
    }

    public function test_existing_email_password_authentication_regression_still_works(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Normal Customer',
            'email' => 'normal@example.com',
            'phone' => '09172222222',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertCreated()->assertJsonPath('user.role', 'customer');

        $login = $this->postJson('/api/auth/login', [
            'email' => 'normal@example.com',
            'password' => 'password',
        ])->assertOk();

        $token = $login->json('token');

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'normal@example.com')
            ->assertJsonMissingPath('user.google_id');

        $this->withToken($token)
            ->postJson('/api/auth/logout')
            ->assertOk();

        $tokenId = (int) strtok($token, '|');

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $tokenId,
        ]);

        $this->app['auth']->forgetGuards();

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertUnauthorized();
    }

    private function startGoogle(string $returnTo = '/account'): array
    {
        $response = $this->get('/api/auth/google/redirect?'.http_build_query([
            'return_to' => $returnTo,
        ]));

        return $this->redirectQuery($response)['query'];
    }

    private function completeGoogleCallback(string $returnTo = '/account')
    {
        $state = $this->startGoogle($returnTo);

        return $this->get('/api/auth/google/callback?'.http_build_query([
            'state' => $state['state'],
            'code' => 'provider-code',
        ]));
    }

    private function fakeGoogleIdentity(array $profile): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'access_token' => 'provider-access-token',
                'token_type' => 'Bearer',
            ], 200),
            'https://openidconnect.googleapis.com/v1/userinfo' => Http::response($profile, 200),
        ]);
    }

    private function redirectQuery($response): array
    {
        $location = (string) $response->headers->get('Location');
        $parsed = parse_url($location);
        $query = [];

        parse_str($parsed['query'] ?? '', $query);

        return [
            'location' => $location,
            'query' => $query,
        ];
    }

    private function createCustomerUser(
        string $email,
        string $name,
        ?string $googleId = null,
    ): User {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => 'password',
            'google_id' => $googleId,
            'role' => 'customer',
            'status' => 'active',
            'branch_id' => null,
        ]);

        Customer::create([
            'user_id' => $user->id,
            'full_name' => $name,
            'contact_number' => '0917'.random_int(1000000, 9999999),
            'email' => $email,
        ]);

        return $user;
    }
}
