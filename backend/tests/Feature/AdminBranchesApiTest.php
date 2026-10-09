<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\PickupRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminBranchesApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_branch_endpoints_require_admin_role(): void
    {
        $this->getJson('/api/admin/branches')->assertUnauthorized();

        $staff = $this->createUser('staff');

        $this->adminRequest($staff)
            ->getJson('/api/admin/branches')
            ->assertForbidden();
    }

    public function test_admin_can_list_search_view_create_and_update_real_branches(): void
    {
        $admin = $this->createUser('admin');
        $branch = $this->createBranch('Makati Branch');
        $this->createUser('staff', $branch);

        $this->adminRequest($admin)
            ->getJson('/api/admin/branches?search=makati')
            ->assertOk()
            ->assertJsonPath('summary.total_branches', 1)
            ->assertJsonPath('summary.active_branches', 1)
            ->assertJsonPath('summary.active_staff', 1)
            ->assertJsonPath('branches.0.name', 'Makati Branch')
            ->assertJsonPath('branches.0.staff_count', 1)
            ->assertJsonPath('branches.0.active_staff_count', 1);

        $this->adminRequest($admin)
            ->getJson('/api/admin/branches/'.$branch->id)
            ->assertOk()
            ->assertJsonPath('branch.staff.0.name', 'Staff Branch User');

        $created = $this->adminRequest($admin)
            ->postJson('/api/admin/branches', [
                'name' => ' Imus Branch ',
                'address' => 'Imus address',
                'contact_number' => '09170000000',
            ])
            ->assertCreated()
            ->assertJsonPath('branch.name', 'Imus Branch')
            ->json('branch');

        $this->adminRequest($admin)
            ->postJson('/api/admin/branches', [
                'name' => 'imus branch',
                'address' => 'Duplicate address',
                'contact_number' => '09170000001',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);

        $this->adminRequest($admin)
            ->patchJson('/api/admin/branches/'.$created['id'], [
                'name' => 'Imus Motorshop',
                'status' => 'inactive',
                'pickup_available' => false,
            ])
            ->assertOk()
            ->assertJsonPath('branch.name', 'Imus Motorshop')
            ->assertJsonPath('branch.status', 'inactive')
            ->assertJsonPath('branch.pickup_available', false);

        $this->getJson('/api/branches')
            ->assertOk()
            ->assertJsonMissing(['name' => 'Imus Motorshop']);
    }

    public function test_admin_pickup_filter_handles_false_query_string(): void
    {
        $admin = $this->createUser('admin');
        $pickupEnabled = $this->createBranch('Pickup Enabled');
        $pickupDisabled = $this->createBranch('Pickup Disabled');
        $pickupDisabled->update(['pickup_available' => false]);

        $this->adminRequest($admin)
            ->getJson('/api/admin/branches?pickup_available=false')
            ->assertOk()
            ->assertJsonPath('summary.pickup_available_branches', 1)
            ->assertJsonPath('branches.0.id', $pickupDisabled->id)
            ->assertJsonMissing(['id' => $pickupEnabled->id]);

        $this->adminRequest($admin)
            ->getJson('/api/admin/branches?pickup_available=true')
            ->assertOk()
            ->assertJsonPath('branches.0.id', $pickupEnabled->id)
            ->assertJsonMissing(['id' => $pickupDisabled->id]);
    }

    public function test_referenced_branches_cannot_be_deleted_but_unused_branches_can(): void
    {
        $admin = $this->createUser('admin');
        $customer = Customer::create([
            'full_name' => 'Branch Test Customer',
            'contact_number' => '09170000002',
            'email' => 'branch-customer@example.com',
        ]);

        $staffBranch = $this->createBranch('Staff Reference');
        $this->createUser('staff', $staffBranch);

        $orderBranch = $this->createBranch('Order Reference');
        $order = $this->createOrder($customer, $orderBranch, 'BRANCH-ORDER-001');

        $pickupBranch = $this->createBranch('Pickup Reference');
        PickupRequest::create([
            'order_id' => $order->id,
            'branch_id' => $pickupBranch->id,
        ]);

        $deliveryBranch = $this->createBranch('Delivery Reference');
        DeliveryRequest::create([
            'order_id' => $order->id,
            'branch_id' => $deliveryBranch->id,
            'delivery_address' => 'Delivery test address',
        ]);

        foreach ([$staffBranch, $orderBranch, $pickupBranch, $deliveryBranch] as $branch) {
            $this->adminRequest($admin)
                ->deleteJson('/api/admin/branches/'.$branch->id)
                ->assertStatus(409);
        }

        $unused = $this->createBranch('Unused Branch');

        $this->adminRequest($admin)
            ->deleteJson('/api/admin/branches/'.$unused->id)
            ->assertOk();

        $this->assertDatabaseMissing('branches', ['id' => $unused->id]);
    }

    private function adminRequest(User $user)
    {
        return $this->withToken($user->createToken('branch-test')->plainTextToken);
    }

    private function createUser(string $role, ?Branch $branch = null): User
    {
        return User::create([
            'name' => $role === 'staff' ? 'Staff Branch User' : 'Admin Branch User',
            'email' => $role.'-branch-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch?->id,
            'status' => 'active',
            'role' => $role,
        ]);
    }

    private function createBranch(string $name): Branch
    {
        return Branch::create([
            'name' => $name,
            'address' => $name.' address',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ]);
    }

    private function createOrder(Customer $customer, Branch $branch, string $reference): OrderRequest
    {
        return OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => 'pickup',
            'order_status' => 'pending',
            'subtotal' => 100,
            'delivery_fee' => 0,
            'total_amount' => 100,
        ]);
    }
}
