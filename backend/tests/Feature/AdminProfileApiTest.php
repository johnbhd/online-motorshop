<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminProfileApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_admin_can_read_and_update_only_the_authenticated_profile(): void
    {
        $admin = $this->createUser('Admin User', 'admin-profile@example.com', 'admin');
        $otherAdmin = $this->createUser('Other Admin', 'other-admin@example.com', 'admin');
        $this->requestAs($admin)
            ->getJson('/api/admin/profile')
            ->assertOk()
            ->assertJsonPath('user.name', 'Admin User')
            ->assertJsonPath('user.email', 'admin-profile@example.com')
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonPath('user.status', 'active')
            ->assertJsonMissingPath('user.password');

        $this->requestAs($admin)
            ->patchJson('/api/admin/profile', [
                'name' => ' Updated Admin ',
                'email' => ' UPDATED-ADMIN@EXAMPLE.COM ',
                'role' => 'staff',
                'branch_id' => 999,
                'user_id' => $otherAdmin->id,
                'status' => 'inactive',
            ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Updated Admin')
            ->assertJsonPath('user.email', 'updated-admin@example.com')
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonPath('user.status', 'active');

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
            'name' => 'Updated Admin',
            'email' => 'updated-admin@example.com',
            'role' => 'admin',
            'status' => 'active',
            'branch_id' => null,
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $otherAdmin->id,
            'name' => 'Other Admin',
            'email' => 'other-admin@example.com',
        ]);
    }

    public function test_profile_email_must_be_unique_and_profile_is_admin_only(): void
    {
        $this->getJson('/api/admin/profile')->assertUnauthorized();

        $admin = $this->createUser('Admin User', 'admin-unique@example.com', 'admin');
        $this->createUser('Other Admin', 'staff-profile@example.com', 'admin');
        $this->requestAs($admin)
            ->patchJson('/api/admin/profile', [
                'name' => 'Admin User',
                'email' => 'staff-profile@example.com',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_staff_cannot_read_or_update_admin_profile(): void
    {
        $staff = $this->createUser('Staff User', 'staff-profile@example.com', 'staff');
        $this->requestAs($staff)->getJson('/api/admin/profile')->assertForbidden();
        $this->requestAs($staff)->patchJson('/api/admin/profile', [
            'name' => 'Staff User',
            'email' => 'staff-profile@example.com',
        ])->assertForbidden();
    }

    public function test_admin_password_change_verifies_current_password_and_revokes_other_tokens(): void
    {
        $admin = $this->createUser('Password Admin', 'password-admin@example.com', 'admin');
        $currentToken = $admin->createToken('current-session')->plainTextToken;
        $otherToken = $admin->createToken('other-session')->plainTextToken;
        [$currentTokenId] = explode('|', $currentToken, 2);
        [$otherTokenId] = explode('|', $otherToken, 2);

        $this->withToken($currentToken)
            ->patchJson('/api/admin/profile/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');

        $this->withToken($currentToken)
            ->patchJson('/api/admin/profile/password', [
                'current_password' => 'old-password-123',
                'password' => 'new-password-123',
                'password_confirmation' => 'new-password-123',
            ])
            ->assertOk()
            ->assertJsonPath('message', 'Password updated successfully. Other active sessions have been signed out.');

        $this->assertTrue(Hash::check('new-password-123', $admin->fresh()->password));
        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->assertDatabaseHas('personal_access_tokens', ['id' => $currentTokenId]);
        $this->assertDatabaseMissing('personal_access_tokens', ['id' => $otherTokenId]);
        $this->requestAs($admin)->getJson('/api/admin/profile')->assertOk();
    }

    private function createUser(string $name, string $email, string $role): User
    {
        return User::create([
            'name' => $name,
            'email' => $email,
            'password' => 'old-password-123',
            'status' => 'active',
            'role' => $role,
        ]);
    }

    private function requestAs(User $user)
    {
        return $this->withToken($user->createToken('admin-profile-test')->plainTextToken);
    }
}
