<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminCustomersApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_customer_endpoints_require_an_active_admin(): void
    {
        $this->getJson('/api/admin/customers')->assertUnauthorized();

        $staff = $this->createUser('staff');
        $customer = $this->createUser('customer');
        $inactiveAdmin = $this->createUser('admin', 'inactive');

        $this->requestAs($staff)->getJson('/api/admin/customers')->assertForbidden();
        $this->requestAs($customer)->getJson('/api/admin/customers')->assertForbidden();
        $this->requestAs($inactiveAdmin)->getJson('/api/admin/customers')->assertForbidden();
    }

    public function test_admin_can_list_customers_across_branches_with_real_filters_and_pagination(): void
    {
        $admin = $this->createUser('admin');
        $branch = $this->createBranch('Makati');
        $otherBranch = $this->createBranch('Manila');
        [$activeUser, $registered] = $this->createRegistered('Active Registered', 'active@example.com');
        [, $inactiveRegistered] = $this->createRegistered('Inactive Registered', 'inactive@example.com', 'inactive');
        $guest = $this->createGuest('Guest Customer');

        $this->createOrder($registered, $branch, 'pending', 180);
        $this->createOrder($inactiveRegistered, $otherBranch, 'completed', 240);
        $this->createOrder($guest, $branch, 'completed', 100);

        $response = $this->requestAs($admin)
            ->getJson('/api/admin/customers?per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 3)
            ->assertJsonPath('summary.registered', 2)
            ->assertJsonPath('summary.guest', 1)
            ->assertJsonPath('summary.customers_with_active_orders', 1)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.total', 3);

        $listed = collect($response->json('customers'))->first();
        $this->assertArrayNotHasKey('password', $listed);
        $this->assertArrayNotHasKey('remember_token', $listed);

        $this->requestAs($admin)
            ->getJson('/api/admin/customers?search=active%40example.com&type=registered&status=active')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('customers.0.id', $registered->id)
            ->assertJsonPath('customers.0.email', $activeUser->email);

        $this->requestAs($admin)
            ->getJson('/api/admin/customers?branch_id='.$branch->id)
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('customers.0.orders', 1);

        $this->requestAs($admin)
            ->getJson('/api/admin/customers?type=guest')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('customers.0.type', 'guest');
    }

    public function test_detail_uses_persisted_order_history_without_creating_a_conversation(): void
    {
        $admin = $this->createUser('admin');
        $branch = $this->createBranch('Details Branch');
        $customer = $this->createGuest('Historical Customer');
        $order = $this->createOrder($customer, $branch, 'completed', 180);
        $conversationsBefore = Conversation::query()->count();

        $this->requestAs($admin)
            ->getJson('/api/admin/customers/'.$customer->id)
            ->assertOk()
            ->assertJsonPath('customer.id', $customer->id)
            ->assertJsonPath('customer.type', 'guest')
            ->assertJsonPath('customer.summary.orders', 1)
            ->assertJsonPath('customer.summary.last_order.reference', $order->order_reference)
            ->assertJsonPath('customer.orders.0.total_amount', 180)
            ->assertJsonPath('customer.branches.0.name', 'Details Branch')
            ->assertJsonMissingPath('customer.password')
            ->assertJsonMissingPath('customer.account.tokens');

        $this->assertSame($conversationsBefore, Conversation::query()->count());
    }

    public function test_guest_and_registered_updates_preserve_identity_and_role_boundaries(): void
    {
        $admin = $this->createUser('admin');
        $guest = $this->createGuest('Guest Before');
        $registeredUser = $this->createUser('customer', 'active', 'Registered Before');
        $registered = Customer::create([
            'user_id' => $registeredUser->id,
            'full_name' => $registeredUser->name,
            'contact_number' => '09170000001',
            'email' => $registeredUser->email,
        ]);

        $this->requestAs($admin)
            ->patchJson('/api/admin/customers/'.$guest->id, [
                'name' => 'Guest After',
                'contact_number' => '09170000002',
                'role' => 'admin',
                'customer_type' => 'registered',
            ])
            ->assertOk()
            ->assertJsonPath('customer.name', 'Guest After')
            ->assertJsonPath('customer.type', 'guest');

        $this->assertDatabaseHas('customers', [
            'id' => $guest->id,
            'full_name' => 'Guest After',
            'user_id' => null,
        ]);
        $this->assertDatabaseMissing('users', ['name' => 'Guest After']);

        $this->requestAs($admin)
            ->patchJson('/api/admin/customers/'.$registered->id, [
                'name' => 'Registered After',
                'email' => 'registered-after@example.com',
                'status' => 'inactive',
                'role' => 'admin',
            ])
            ->assertOk()
            ->assertJsonPath('customer.name', 'Registered After')
            ->assertJsonPath('customer.email', 'registered-after@example.com')
            ->assertJsonPath('customer.account_status', 'inactive');

        $this->assertDatabaseHas('users', [
            'id' => $registeredUser->id,
            'name' => 'Registered After',
            'email' => 'registered-after@example.com',
            'status' => 'inactive',
            'role' => 'customer',
        ]);
        $this->assertDatabaseHas('customers', [
            'id' => $registered->id,
            'email' => 'registered-after@example.com',
        ]);

        $this->requestAs($admin)
            ->patchJson('/api/admin/customers/'.$guest->id, ['status' => 'inactive'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);
    }

    public function test_registered_email_is_unique_and_deletion_is_dependency_safe(): void
    {
        $admin = $this->createUser('admin');
        $registeredUser = $this->createUser('customer', 'active', 'Registered Customer');
        $registered = Customer::create([
            'user_id' => $registeredUser->id,
            'full_name' => $registeredUser->name,
            'contact_number' => '09170000003',
            'email' => $registeredUser->email,
        ]);
        $otherUser = $this->createUser('customer', 'active', 'Other Customer');

        $this->requestAs($admin)
            ->patchJson('/api/admin/customers/'.$registered->id, ['email' => $otherUser->email])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $unusedGuest = $this->createGuest('Unused Guest');
        $this->requestAs($admin)
            ->deleteJson('/api/admin/customers/'.$unusedGuest->id)
            ->assertOk();
        $this->assertDatabaseMissing('customers', ['id' => $unusedGuest->id]);

        $referencedGuest = $this->createGuest('Referenced Guest');
        $branch = $this->createBranch('Reference Branch');
        $this->createOrder($referencedGuest, $branch, 'pending', 90);

        $this->requestAs($admin)
            ->deleteJson('/api/admin/customers/'.$referencedGuest->id)
            ->assertStatus(409);
        $this->assertDatabaseHas('customers', ['id' => $referencedGuest->id]);

        $this->requestAs($admin)
            ->deleteJson('/api/admin/customers/'.$registered->id)
            ->assertStatus(409);
        $this->assertDatabaseHas('users', ['id' => $registeredUser->id]);
    }

    private function requestAs(User $user)
    {
        return $this->withToken($user->createToken('admin-customers-test')->plainTextToken);
    }

    private function createUser(string $role, string $status = 'active', ?string $name = null): User
    {
        $name ??= ucfirst($role).' User';

        return User::create([
            'name' => $name,
            'email' => strtolower(str_replace(' ', '-', $name)).'-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => $status,
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

    private function createGuest(string $name): Customer
    {
        return Customer::create([
            'full_name' => $name,
            'contact_number' => '0917'.random_int(1000000, 9999999),
            'email' => strtolower(str_replace(' ', '.', $name)).'@example.com',
        ]);
    }

    private function createRegistered(string $name, string $email, string $status = 'active'): array
    {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('password'),
            'status' => $status,
            'role' => 'customer',
        ]);
        $customer = Customer::create([
            'user_id' => $user->id,
            'full_name' => $name,
            'contact_number' => '0917'.random_int(1000000, 9999999),
            'email' => $email,
        ]);

        return [$user, $customer];
    }

    private function createOrder(Customer $customer, Branch $branch, string $status, float $amount): OrderRequest
    {
        return OrderRequest::create([
            'order_reference' => 'ALD-'.uniqid(),
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => 'pickup',
            'order_status' => $status,
            'subtotal' => $amount,
            'delivery_fee' => 0,
            'total_amount' => $amount,
        ]);
    }
}
