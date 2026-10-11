<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_profile_requires_authentication_and_customer_role(): void
    {
        $this->getJson('/api/customer/profile')->assertUnauthorized();
        $this->patchJson('/api/customer/profile', [
            'name' => 'Updated Customer',
            'email' => 'updated@example.com',
            'contact_number' => '09170000000',
        ])->assertUnauthorized();

        $staff = User::create([
            'name' => 'Staff User',
            'email' => 'staff-profile@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'staff',
        ]);
        $token = $staff->createToken('customer-profile-test')->plainTextToken;

        $this->withToken($token)->getJson('/api/customer/profile')->assertForbidden();
        $this->withToken($token)->patchJson('/api/customer/profile', [
            'name' => 'Updated Customer',
            'email' => 'updated@example.com',
            'contact_number' => '09170000000',
        ])->assertForbidden();
    }

    public function test_customer_can_read_and_update_their_profile_without_changing_account_permissions(): void
    {
        $customer = $this->createCustomer();
        $token = $customer->createToken('customer-profile-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/customer/profile')
            ->assertOk()
            ->assertJsonPath('user.id', $customer->id)
            ->assertJsonPath('user.name', 'Profile Customer')
            ->assertJsonPath('user.email', 'profile-customer@example.com')
            ->assertJsonPath('user.customer.contact_number', '09170000000')
            ->assertJsonMissingPath('user.password');

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Updated Customer',
                'email' => 'updated-customer@example.com',
                'contact_number' => '09171112222',
                'address' => 'Makati City',
                'role' => 'admin',
                'status' => 'inactive',
                'user_id' => 999,
            ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Updated Customer')
            ->assertJsonPath('user.email', 'updated-customer@example.com')
            ->assertJsonPath('user.customer.full_name', 'Updated Customer')
            ->assertJsonPath('user.customer.email', 'updated-customer@example.com')
            ->assertJsonPath('user.customer.contact_number', '09171112222')
            ->assertJsonPath('user.customer.address', 'Makati City')
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonPath('user.status', 'active');

        $this->assertDatabaseHas('users', [
            'id' => $customer->id,
            'name' => 'Updated Customer',
            'email' => 'updated-customer@example.com',
            'role' => 'customer',
            'status' => 'active',
        ]);
        $this->assertDatabaseHas('customers', [
            'user_id' => $customer->id,
            'full_name' => 'Updated Customer',
            'email' => 'updated-customer@example.com',
            'contact_number' => '09171112222',
            'address' => 'Makati City',
        ]);
    }

    public function test_customer_profile_validates_unique_email_and_password_changes_require_current_password(): void
    {
        $customer = $this->createCustomer();
        User::create([
            'name' => 'Existing User',
            'email' => 'existing@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $token = $customer->createToken('customer-profile-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Profile Customer',
                'email' => 'existing@example.com',
                'contact_number' => '09170000000',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->withToken($token)
            ->patchJson('/api/customer/profile/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);

        $this->withToken($token)
            ->patchJson('/api/customer/profile/password', [
                'current_password' => 'password',
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Password updated successfully. Other active sessions have been signed out.');

        $this->assertTrue(Hash::check('new-password-123', $customer->fresh()->password));
        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_customer_can_save_and_clear_an_optional_location_pin(): void
    {
        $customer = $this->createCustomer();
        $token = $customer->createToken('customer-profile-location-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Profile Customer',
                'email' => 'profile-customer@example.com',
                'contact_number' => '09170000000',
                'latitude' => 14.599512,
                'longitude' => 120.984222,
            ])
            ->assertOk()
            ->assertJsonPath('user.customer.latitude', 14.599512)
            ->assertJsonPath('user.customer.longitude', 120.984222);

        $this->assertDatabaseHas('customers', [
            'user_id' => $customer->id,
            'latitude' => 14.599512,
            'longitude' => 120.984222,
        ]);

        $this->withToken($token)
            ->patchJson('/api/customer/profile', [
                'name' => 'Profile Customer',
                'email' => 'profile-customer@example.com',
                'contact_number' => '09170000000',
                'latitude' => null,
                'longitude' => null,
            ])
            ->assertOk()
            ->assertJsonPath('user.customer.latitude', null)
            ->assertJsonPath('user.customer.longitude', null);
    }

    public function test_customer_profile_rejects_invalid_or_partial_location_coordinates(): void
    {
        $customer = $this->createCustomer();
        $token = $customer->createToken('customer-profile-location-test')->plainTextToken;
        $payload = [
            'name' => 'Profile Customer',
            'email' => 'profile-customer@example.com',
            'contact_number' => '09170000000',
        ];

        $this->withToken($token)
            ->patchJson('/api/customer/profile', $payload + ['latitude' => 91, 'longitude' => 120])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['latitude']);

        $this->withToken($token)
            ->patchJson('/api/customer/profile', $payload + ['latitude' => 14.5])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['longitude']);

        $this->withToken($token)
            ->patchJson('/api/customer/profile', $payload + ['longitude' => 181])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['longitude']);
    }

    private function createCustomer(): User
    {
        $customer = User::create([
            'name' => 'Profile Customer',
            'email' => 'profile-customer@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);

        $customer->customer()->create([
            'full_name' => 'Profile Customer',
            'contact_number' => '09170000000',
            'email' => 'profile-customer@example.com',
        ]);

        return $customer;
    }
}
