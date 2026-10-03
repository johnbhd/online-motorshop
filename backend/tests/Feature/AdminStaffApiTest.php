<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Message;
use App\Models\OrderRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminStaffApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_staff_endpoints_require_an_active_admin(): void
    {
        $this->getJson('/api/admin/staff')->assertUnauthorized();

        $staff = $this->createUser('staff', $this->createBranch('Staff branch'));
        $customer = $this->createUser('customer');
        $inactiveAdmin = $this->createUser('admin', null, 'inactive');

        $this->requestAs($staff)->getJson('/api/admin/staff')->assertForbidden();
        $this->requestAs($customer)->getJson('/api/admin/staff')->assertForbidden();
        $this->requestAs($inactiveAdmin)->getJson('/api/admin/staff')->assertForbidden();
    }

    public function test_admin_can_list_filter_view_and_create_real_staff_accounts(): void
    {
        $admin = $this->createUser('admin');
        $branch = $this->createBranch('Makati Staff Branch');
        $otherBranch = $this->createBranch('Other Staff Branch');
        $staff = $this->createUser('staff', $branch, 'active', 'Maria Staff');
        $this->createUser('staff', $otherBranch, 'inactive', 'Inactive Staff');
        $this->createUser('customer', $branch, 'active', 'Customer User');

        $this->requestAs($admin)
            ->getJson('/api/admin/staff?search=maria&branch_id='.$branch->id.'&status=active&per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total_staff', 2)
            ->assertJsonPath('summary.active_staff', 1)
            ->assertJsonPath('summary.inactive_staff', 1)
            ->assertJsonPath('staff.0.id', $staff->id)
            ->assertJsonPath('staff.0.branch.id', $branch->id)
            ->assertJsonPath('staff.0.branch.name', 'Makati Staff Branch')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 1)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonMissingPath('staff.0.password')
            ->assertJsonMissingPath('staff.0.remember_token');

        $this->requestAs($admin)
            ->getJson('/api/admin/staff/'.$staff->id)
            ->assertOk()
            ->assertJsonPath('staff.name', 'Maria Staff')
            ->assertJsonPath('staff.role', 'staff');

        $customer = $this->createUser('customer', $branch, 'active', 'Not Staff');
        $this->requestAs($admin)
            ->getJson('/api/admin/staff/'.$customer->id)
            ->assertNotFound();

        $created = $this->requestAs($admin)
            ->postJson('/api/admin/staff', [
                'name' => ' New Staff ',
                'email' => 'new-staff@example.com',
                'role' => 'admin',
                'branch_id' => $branch->id,
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ])
            ->assertCreated()
            ->assertJsonPath('staff.name', 'New Staff')
            ->assertJsonPath('staff.email', 'new-staff@example.com')
            ->assertJsonPath('staff.role', 'staff')
            ->assertJsonPath('staff.status', 'active')
            ->json('staff');

        $this->assertDatabaseHas('users', [
            'id' => $created['id'],
            'role' => 'staff',
            'branch_id' => $branch->id,
        ]);
        $this->assertTrue(Hash::check('new-password', User::findOrFail($created['id'])->password));

        $this->postJson('/api/auth/login', [
            'email' => 'new-staff@example.com',
            'password' => 'new-password',
        ])->assertOk()->assertJsonPath('user.role', 'staff');
    }

    public function test_create_update_password_and_status_lifecycle_are_server_enforced(): void
    {
        $admin = $this->createUser('admin');
        $activeBranch = $this->createBranch('Active Branch');
        $inactiveBranch = $this->createBranch('Inactive Branch', 'inactive');

        $this->requestAs($admin)
            ->postJson('/api/admin/staff', [
                'name' => 'Invalid Branch Staff',
                'email' => 'invalid-branch-staff@example.com',
                'branch_id' => $inactiveBranch->id,
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['branch_id']);

        $staff = $this->createUser('staff', $activeBranch, 'active', 'Lifecycle Staff');
        $staffToken = $staff->createToken('lifecycle-test')->plainTextToken;

        $this->requestAs($admin)
            ->patchJson('/api/admin/staff/'.$staff->id, [
                'name' => 'Updated Staff',
                'email' => 'updated-staff@example.com',
                'branch_id' => $activeBranch->id,
                'status' => 'inactive',
                'role' => 'admin',
                'password' => 'should-not-be-updated',
            ])
            ->assertOk()
            ->assertJsonPath('staff.name', 'Updated Staff')
            ->assertJsonPath('staff.status', 'inactive')
            ->assertJsonPath('staff.role', 'staff');

        $this->assertDatabaseHas('users', [
            'id' => $staff->id,
            'email' => 'updated-staff@example.com',
            'status' => 'inactive',
            'role' => 'staff',
        ]);
        $this->withToken($staffToken)->getJson('/api/staff/profile')->assertForbidden();

        $newPassword = 'updated-password';
        $this->requestAs($admin)
            ->patchJson('/api/admin/staff/'.$staff->id.'/password', [
                'password' => $newPassword,
                'password_confirmation' => $newPassword,
            ])
            ->assertOk()
            ->assertJsonMissingPath('staff.password');

        $this->postJson('/api/auth/login', [
            'email' => 'updated-staff@example.com',
            'password' => $newPassword,
        ])->assertUnprocessable();

        $this->requestAs($admin)
            ->patchJson('/api/admin/staff/'.$staff->id, ['status' => 'active'])
            ->assertOk()
            ->assertJsonPath('staff.status', 'active');

        $this->postJson('/api/auth/login', [
            'email' => 'updated-staff@example.com',
            'password' => $newPassword,
        ])->assertOk();
    }

    public function test_delete_blocks_referenced_staff_but_allows_unused_staff(): void
    {
        $admin = $this->createUser('admin');
        $branch = $this->createBranch('Reference Branch');
        $customer = Customer::create([
            'full_name' => 'Reference Customer',
            'contact_number' => '09170000001',
            'email' => 'reference-customer@example.com',
        ]);

        $referenced = $this->createUser('staff', $branch, 'active', 'Referenced Staff');
        $order = OrderRequest::create([
            'order_reference' => 'REF-'.uniqid(),
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'assigned_staff_id' => $referenced->id,
            'fulfillment_type' => 'pickup',
            'order_status' => 'pending',
            'subtotal' => 100,
            'delivery_fee' => 0,
            'total_amount' => 100,
        ]);

        $this->requestAs($admin)
            ->deleteJson('/api/admin/staff/'.$referenced->id)
            ->assertStatus(409);
        $this->assertDatabaseHas('users', ['id' => $referenced->id]);
        $this->assertDatabaseHas('order_requests', [
            'id' => $order->id,
            'assigned_staff_id' => $referenced->id,
        ]);

        $messageStaff = $this->createUser('staff', $branch, 'active', 'Message Staff');
        $conversation = Conversation::create([
            'participant_type' => 'guest',
            'status' => 'open',
        ]);
        Message::create([
            'conversation_id' => $conversation->id,
            'sender_type' => 'staff',
            'sender_user_id' => $messageStaff->id,
            'body' => 'Reference message',
        ]);

        $this->requestAs($admin)
            ->deleteJson('/api/admin/staff/'.$messageStaff->id)
            ->assertStatus(409);

        $unused = $this->createUser('staff', $branch, 'inactive', 'Unused Staff');
        $this->requestAs($admin)
            ->deleteJson('/api/admin/staff/'.$unused->id)
            ->assertOk()
            ->assertJsonPath('message', 'Staff account deleted successfully.');
        $this->assertDatabaseMissing('users', ['id' => $unused->id]);
    }

    private function requestAs(User $user)
    {
        return $this->withToken($user->createToken('admin-staff-test')->plainTextToken);
    }

    private function createUser(
        string $role,
        ?Branch $branch = null,
        string $status = 'active',
        ?string $name = null,
    ): User {
        $label = $name ?? ucfirst($role).' User';

        return User::create([
            'name' => $label,
            'email' => strtolower(str_replace(' ', '-', $label)).'-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch?->id,
            'status' => $status,
            'role' => $role,
        ]);
    }

    private function createBranch(string $name, string $status = 'active'): Branch
    {
        return Branch::create([
            'name' => $name,
            'address' => $name.' address',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => $status,
        ]);
    }
}
