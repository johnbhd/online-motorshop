<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminOrdersApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_admin_can_view_all_branches_with_real_filters_and_pagination(): void
    {
        $admin = $this->createUser('admin');
        $manila = $this->createBranch('Manila');
        $makati = $this->createBranch('Makati');
        $first = $this->createOrder('Mark Reyes', $manila, 'ALD-2026-ADMIN-001', 'pending');
        $second = $this->createOrder('Angela Cruz', $makati, 'ALD-2026-ADMIN-002', 'confirmed');
        $second->payments()->create([
            'payment_method' => Payment::METHOD_ONLINE_PAYMENT,
            'amount' => 250,
            'payment_status' => Payment::STATUS_PAID,
        ]);

        $response = $this->requestAs($admin)
            ->getJson('/api/admin/orders?per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(1, 'orders');

        $this->assertSame($second->order_reference, $response->json('orders.0.reference'));

        $this->requestAs($admin)
            ->getJson('/api/admin/orders?per_page=1&page=2')
            ->assertOk()
            ->assertJsonPath('orders.0.reference', $first->order_reference);

        $this->requestAs($admin)
            ->getJson('/api/admin/orders?branch_id='.$makati->id.'&payment_status=paid')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('orders.0.reference', $second->order_reference)
            ->assertJsonPath('orders.0.payment_method', Payment::METHOD_ONLINE_PAYMENT);

        $this->requestAs($admin)
            ->getJson('/api/admin/orders?search=Mark')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('orders.0.reference', $first->order_reference);
    }

    public function test_admin_detail_preserves_null_payment_and_supports_safe_transition_and_assignment(): void
    {
        $admin = $this->createUser('admin');
        $branch = $this->createBranch('Admin Detail Branch');
        $otherBranch = $this->createBranch('Other Branch');
        $staff = $this->createUser('staff', $branch);
        $otherStaff = $this->createUser('staff', $otherBranch);
        $order = $this->createOrder('Detail Customer', $branch, 'ALD-2026-ADMIN-003', 'pending');

        $this->requestAs($admin)
            ->getJson('/api/admin/orders/'.$order->order_reference)
            ->assertOk()
            ->assertJsonPath('order.reference', $order->order_reference)
            ->assertJsonPath('order.payment', null)
            ->assertJsonPath('order.allowed_statuses.0', 'under_review')
            ->assertJsonPath('assignable_staff.0.id', $staff->id);

        $this->requestAs($admin)
            ->patchJson('/api/admin/orders/'.$order->order_reference.'/assignment', ['staff_id' => $staff->id])
            ->assertOk()
            ->assertJsonPath('order.assigned_staff.id', $staff->id);

        $this->requestAs($admin)
            ->patchJson('/api/admin/orders/'.$order->order_reference.'/assignment', ['staff_id' => $otherStaff->id])
            ->assertUnprocessable();

        $this->requestAs($admin)
            ->patchJson('/api/admin/orders/'.$order->order_reference.'/status', ['status' => 'under_review'])
            ->assertOk()
            ->assertJsonPath('order.status', 'under_review');

        $this->requestAs($admin)
            ->patchJson('/api/admin/orders/'.$order->order_reference.'/status', ['status' => 'completed'])
            ->assertUnprocessable();
    }

    public function test_admin_orders_require_admin_and_staff_scope_is_unchanged(): void
    {
        $this->getJson('/api/admin/orders')->assertUnauthorized();

        $branch = $this->createBranch('Scoped Branch');
        $otherBranch = $this->createBranch('Hidden Branch');
        $staff = $this->createUser('staff', $branch);
        $customer = $this->createCustomer('Hidden Order Customer');
        $order = $this->createOrder($customer->full_name, $otherBranch, 'ALD-2026-ADMIN-004', 'pending');

        $this->requestAs($staff)->getJson('/api/admin/orders')->assertForbidden();
        $this->requestAs($staff)->getJson('/api/staff/orders/'.$order->order_reference)->assertNotFound();
    }

    private function requestAs(User $user)
    {
        return $this->withToken($user->createToken('admin-orders-test')->plainTextToken);
    }

    private function createUser(string $role, ?Branch $branch = null): User
    {
        return User::create([
            'name' => ucfirst($role).' User',
            'email' => $role.'-'.uniqid().'@example.com',
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

    private function createCustomer(string $name): Customer
    {
        return Customer::create([
            'full_name' => $name,
            'contact_number' => '09171111111',
            'email' => strtolower(str_replace(' ', '.', $name)).'@example.com',
        ]);
    }

    private function createOrder(string $customerName, Branch $branch, string $reference, string $status): OrderRequest
    {
        $customer = $this->createCustomer($customerName);

        return OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => 'pickup',
            'order_status' => $status,
            'subtotal' => 250,
            'delivery_fee' => 0,
            'total_amount' => 250,
        ]);
    }
}
