<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminDashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_dashboard_requires_admin_authentication_and_role(): void
    {
        $this->getJson('/api/admin/dashboard/data')->assertUnauthorized();

        $customer = $this->createUser('customer');
        $staff = $this->createUser('staff', $this->createBranch('Staff Branch'));

        $this->withToken($customer->createToken('admin-dashboard-customer')->plainTextToken)
            ->getJson('/api/admin/dashboard/data')
            ->assertForbidden();

        $this->withToken($staff->createToken('admin-dashboard-staff')->plainTextToken)
            ->getJson('/api/admin/dashboard/data')
            ->assertForbidden();
    }

    public function test_admin_dashboard_is_real_and_system_wide(): void
    {
        $manila = $this->createBranch('Manila Branch');
        $makati = $this->createBranch('Makati Branch');
        $admin = $this->createUser('admin', $manila);
        $this->createUser('staff', $makati);
        $registeredUser = $this->createUser('customer');
        $registeredCustomer = $this->createCustomer('Registered Customer', $registeredUser);
        $guestCustomer = $this->createCustomer('Guest Customer');
        $product = $this->createProduct('ADMIN-DASH-001', 350);

        $pendingOrder = $this->createOrder(
            $registeredCustomer,
            $product,
            'ALD-ADMIN-001',
            $manila,
            'pending',
            350,
        );
        $latestOrder = $this->createOrder(
            $guestCustomer,
            $product,
            'ALD-ADMIN-002',
            $makati,
            'under_review',
            425,
            'delivery',
        );
        $this->createOrder(
            $registeredCustomer,
            $product,
            'ALD-ADMIN-003',
            $makati,
            'completed',
            500,
        );
        $this->createOrder(
            $guestCustomer,
            $product,
            'ALD-ADMIN-004',
            $manila,
            'cancelled',
            600,
        );

        Payment::create([
            'order_id' => $pendingOrder->id,
            'payment_method' => 'Online Payment',
            'amount' => 350,
            'payment_status' => 'waiting_for_verification',
        ]);
        PickupRequest::create([
            'order_id' => $pendingOrder->id,
            'branch_id' => $manila->id,
            'pickup_status' => 'preparing',
        ]);
        DeliveryRequest::create([
            'order_id' => $latestOrder->id,
            'branch_id' => $makati->id,
            'delivery_address' => 'Makati delivery address',
            'delivery_status' => 'waiting_for_booking',
        ]);

        $conversation = Conversation::create([
            'guest_token_hash' => hash('sha256', 'admin-dashboard-guest'),
            'participant_type' => 'guest',
            'status' => 'open',
        ]);
        $conversation->messages()->create([
            'sender_type' => 'customer',
            'body' => 'I need help with an order.',
        ]);

        $product->update(['price' => 9999]);

        $response = $this->withToken($admin->createToken('admin-dashboard')->plainTextToken)
            ->getJson('/api/admin/dashboard/data')
            ->assertOk();

        $response
            ->assertJsonPath('summary.total_orders', 4)
            ->assertJsonPath('summary.active_orders', 2)
            ->assertJsonPath('summary.pending_orders', 1)
            ->assertJsonPath('summary.payments_attention', 1)
            ->assertJsonPath('summary.pickups_attention', 1)
            ->assertJsonPath('summary.deliveries_attention', 1)
            ->assertJsonPath('summary.active_fulfillment', 2)
            ->assertJsonPath('summary.conversations', 1)
            ->assertJsonPath('summary.customers', 2)
            ->assertJsonPath('summary.registered_customers', 1)
            ->assertJsonPath('summary.guest_customers', 1)
            ->assertJsonPath('summary.staff', 1)
            ->assertJsonPath('summary.products', 1)
            ->assertJsonPath('summary.branches', 2)
            ->assertJsonPath('recent_orders.0.reference', 'ALD-ADMIN-004')
            ->assertJsonPath('recent_orders.0.total_amount', 600)
            ->assertJsonPath('recent_orders.0.branch.name', 'Manila Branch')
            ->assertJsonPath('recent_orders.3.reference', 'ALD-ADMIN-001');

        $branches = collect($response->json('branches'))->keyBy('name');

        $this->assertSame(2, data_get($branches->get('Manila Branch'), 'orders'));
        $this->assertSame(1, data_get($branches->get('Manila Branch'), 'pickup_requests'));
        $this->assertSame(2, data_get($branches->get('Makati Branch'), 'orders'));
        $this->assertSame(1, data_get($branches->get('Makati Branch'), 'delivery_requests'));
        $response->assertJsonMissingPath('recent_orders.0.customer.password');
    }

    public function test_admin_dashboard_returns_truthful_zero_state(): void
    {
        $admin = $this->createUser('admin');

        $this->withToken($admin->createToken('admin-dashboard-empty')->plainTextToken)
            ->getJson('/api/admin/dashboard/data')
            ->assertOk()
            ->assertJsonPath('summary.total_orders', 0)
            ->assertJsonPath('summary.active_orders', 0)
            ->assertJsonPath('summary.payments_attention', 0)
            ->assertJsonPath('summary.active_fulfillment', 0)
            ->assertJsonPath('summary.conversations', 0)
            ->assertJsonPath('summary.customers', 0)
            ->assertJsonPath('summary.staff', 0)
            ->assertJsonPath('summary.products', 0)
            ->assertJsonPath('summary.branches', 0)
            ->assertJsonCount(0, 'branches')
            ->assertJsonCount(0, 'recent_orders');
    }

    private function createUser(string $role, ?Branch $branch = null): User
    {
        return User::create([
            'name' => ucfirst($role).' Dashboard User',
            'email' => $role.'-admin-dashboard-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch?->id,
            'status' => 'active',
            'role' => $role,
        ]);
    }

    private function createCustomer(string $name, ?User $user = null): Customer
    {
        return Customer::create([
            'user_id' => $user?->id,
            'full_name' => $name,
            'contact_number' => '09170000000',
            'email' => strtolower(str_replace(' ', '-', $name)).'-'.uniqid().'@example.com',
        ]);
    }

    private function createProduct(string $partNumber, int $price): Product
    {
        $category = Category::create([
            'name' => 'Admin Dashboard Category '.$partNumber,
        ]);

        return Product::create([
            'part_number' => $partNumber,
            'name' => 'Admin Dashboard Product '.$partNumber,
            'description' => 'Admin dashboard test product',
            'category_id' => $category->id,
            'brand' => 'Admin Dashboard Brand',
            'price' => $price,
            'img_url' => 'admin-dashboard-test.png',
            'availability_status' => 'active',
            'status' => 'active',
        ]);
    }

    private function createOrder(
        Customer $customer,
        Product $product,
        string $reference,
        Branch $branch,
        string $status,
        int $total,
        string $fulfillment = 'pickup',
    ): OrderRequest {
        $order = OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => $fulfillment,
            'order_status' => $status,
            'subtotal' => $total,
            'delivery_fee' => 0,
            'total_amount' => $total,
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'unit_price' => $total,
            'quantity' => 1,
            'subtotal' => $total,
        ]);

        return $order;
    }

    private function createBranch(string $name): Branch
    {
        return Branch::create([
            'name' => $name,
            'address' => 'Admin dashboard test address',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ]);
    }
}
