<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_profile_requires_authentication_and_staff_role(): void
    {
        $this->getJson('/api/staff/profile')->assertUnauthorized();
        $this->patchJson('/api/staff/profile', [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
        ])->assertUnauthorized();

        $customer = User::create([
            'name' => 'Profile Customer',
            'email' => 'profile-customer@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $token = $customer->createToken('staff-profile-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/profile')
            ->assertForbidden();

        $this->withToken($token)
            ->patchJson('/api/staff/profile', [
                'name' => 'Updated Name',
                'email' => 'updated@example.com',
            ])
            ->assertForbidden();
    }

    public function test_staff_can_view_profile_with_real_branch_and_without_sensitive_fields(): void
    {
        $branch = Branch::create([
            'name' => 'Manila Branch',
            'address' => 'Manila',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ]);
        $staff = $this->createStaff($branch, [
            'name' => 'Branch Staff',
            'email' => 'profile-staff@example.com',
        ]);
        $token = $staff->createToken('staff-profile-test')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/staff/profile')
            ->assertOk()
            ->assertJsonPath('user.id', $staff->id)
            ->assertJsonPath('user.name', 'Branch Staff')
            ->assertJsonPath('user.email', 'profile-staff@example.com')
            ->assertJsonPath('user.role', 'staff')
            ->assertJsonPath('user.status', 'active')
            ->assertJsonPath('branch.id', $branch->id)
            ->assertJsonPath('branch.name', 'Manila Branch');

        $response->assertJsonMissingPath('user.password');
        $response->assertJsonMissingPath('user.remember_token');
        $response->assertJsonMissingPath('token');
        $response->assertJsonMissingPath('user.branch_id');
    }

    public function test_staff_can_update_only_their_own_name_and_email(): void
    {
        $branch = $this->createBranch('Makati Branch');
        $staff = $this->createStaff($branch, [
            'name' => 'Before Update',
            'email' => 'before-update@example.com',
        ]);
        $otherUser = User::create([
            'name' => 'Other User',
            'email' => 'other-user@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'staff',
        ]);
        $token = $staff->createToken('staff-profile-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/staff/profile', [
                'name' => 'After Update',
                'email' => 'after-update@example.com',
                'user_id' => $otherUser->id,
                'role' => 'admin',
                'branch_id' => null,
            ])
            ->assertOk()
            ->assertJsonPath('user.name', 'After Update')
            ->assertJsonPath('user.email', 'after-update@example.com')
            ->assertJsonPath('user.role', 'staff')
            ->assertJsonPath('branch.id', $branch->id);

        $this->assertDatabaseHas('users', [
            'id' => $staff->id,
            'name' => 'After Update',
            'email' => 'after-update@example.com',
            'role' => 'staff',
            'branch_id' => $branch->id,
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $otherUser->id,
            'name' => 'Other User',
            'email' => 'other-user@example.com',
        ]);
    }

    public function test_staff_can_keep_current_email_but_duplicate_or_invalid_email_is_rejected(): void
    {
        $branch = $this->createBranch('Imus Branch');
        $staff = $this->createStaff($branch, [
            'name' => 'Profile Staff',
            'email' => 'same-email@example.com',
        ]);
        User::create([
            'name' => 'Existing User',
            'email' => 'existing-email@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $token = $staff->createToken('staff-profile-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/staff/profile', [
                'name' => 'Profile Staff',
                'email' => 'same-email@example.com',
            ])
            ->assertOk();

        $this->withToken($token)
            ->patchJson('/api/staff/profile', [
                'name' => 'Profile Staff',
                'email' => 'existing-email@example.com',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->withToken($token)
            ->patchJson('/api/staff/profile', [
                'name' => '   ',
                'email' => 'not-an-email',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email']);
    }

    private function createBranch(string $name): Branch
    {
        return Branch::create([
            'name' => $name,
            'address' => $name,
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createStaff(Branch $branch, array $overrides = []): User
    {
        return User::create(array_merge([
            'name' => 'Staff Profile User',
            'email' => 'staff-profile-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch->id,
            'status' => 'active',
            'role' => 'staff',
        ], $overrides));
    }
}
