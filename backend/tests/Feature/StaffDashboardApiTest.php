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

class StaffDashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_dashboard_requires_staff_authentication_and_role(): void
    {
        $this->getJson('/api/staff/dashboard/data')->assertUnauthorized();

        $customer = User::create([
            'name' => 'Dashboard Customer',
            'email' => 'dashboard-customer-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);

        $this->withToken($customer->createToken('dashboard-test')->plainTextToken)
            ->getJson('/api/staff/dashboard/data')
            ->assertForbidden();
    }

    public function test_dashboard_is_real_and_branch_scoped(): void
    {
        $branch = $this->createBranch('Dashboard Main Branch');
        $otherBranch = $this->createBranch('Dashboard Other Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Dashboard Customer');
        $product = $this->createProduct('DASH-001', 250);

        $this->createOrder($customer, $product, 'ALD-DASH-001', $branch, 'pending');
        $this->createOrder($customer, $product, 'ALD-DASH-002', $branch, 'under_review');
        $confirmedPickup = $this->createOrder(
            $customer,
            $product,
            'ALD-DASH-003',
            $branch,
            'confirmed',
            'pickup',
        );
        $confirmedDelivery = $this->createOrder(
            $customer,
            $product,
            'ALD-DASH-004',
            $branch,
            'confirmed',
            'delivery',
        );
        $completed = $this->createOrder($customer, $product, 'ALD-DASH-005', $branch, 'completed');
        $this->createOrder($customer, $product, 'ALD-DASH-006', $otherBranch, 'pending');

        Payment::create([
            'order_id' => $confirmedPickup->id,
            'payment_method' => 'Online Payment',
            'amount' => 250,
            'payment_status' => 'waiting_for_verification',
        ]);
        Payment::create([
            'order_id' => $completed->id,
            'payment_method' => 'Online Payment',
            'amount' => 250,
            'payment_status' => 'paid',
        ]);
        PickupRequest::create([
            'order_id' => $confirmedPickup->id,
            'branch_id' => $branch->id,
            'pickup_status' => 'preparing',
        ]);
        DeliveryRequest::create([
            'order_id' => $confirmedDelivery->id,
            'branch_id' => $branch->id,
            'delivery_address' => 'Dashboard delivery address',
            'delivery_status' => 'waiting_for_booking',
        ]);

        $conversation = Conversation::create([
            'guest_token_hash' => hash('sha256', 'dashboard-guest-token'),
            'participant_type' => 'guest',
            'status' => 'open',
        ]);
        $conversation->messages()->create([
            'sender_type' => 'customer',
            'body' => 'Dashboard support request.',
        ]);

        $response = $this->withToken($staff->createToken('dashboard-test')->plainTextToken)
            ->getJson('/api/staff/dashboard/data')
            ->assertOk()
            ->assertJsonPath('branch.id', $branch->id)
            ->assertJsonPath('branch.name', $branch->name)
            ->assertJsonPath('summary.active_orders', 4)
            ->assertJsonPath('summary.pending_orders', 1)
            ->assertJsonPath('summary.under_review_orders', 1)
            ->assertJsonPath('summary.confirmed_orders', 2)
            ->assertJsonPath('summary.completed_orders', 1)
            ->assertJsonPath('summary.completed_today', 1)
            ->assertJsonPath('summary.payments_attention', 1)
            ->assertJsonPath('summary.pickups_attention', 1)
            ->assertJsonPath('summary.deliveries_attention', 1)
            ->assertJsonPath('summary.conversations', 1)
            ->assertJsonPath('operational.orders.pending', 1)
            ->assertJsonPath('operational.payments.waiting_for_verification', 1)
            ->assertJsonPath('operational.pickups.preparing', 1)
            ->assertJsonPath('operational.deliveries.waiting_for_booking', 1)
            ->assertJsonPath('recent_orders.0.reference', 'ALD-DASH-005');

        $response->assertJsonMissingPath('recent_orders.0.customer.password');

        $this->withToken($staff->createToken('dashboard-sidebar-test')->plainTextToken)
            ->getJson('/api/staff/sidebar-summary')
            ->assertOk()
            ->assertJsonPath('counts.orders', 1)
            ->assertJsonPath('counts.payments', 1)
            ->assertJsonPath('counts.pickup_requests', 1)
            ->assertJsonPath('counts.delivery_requests', 1)
            ->assertJsonPath('counts.messages', 1);
    }

    public function test_dashboard_recent_orders_are_limited_newest_first_and_use_persisted_totals(): void
    {
        $branch = $this->createBranch('Dashboard Recent Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Recent Dashboard Customer');
        $product = $this->createProduct('DASH-002', 300);

        for ($index = 1; $index <= 6; $index++) {
            $this->createOrder(
                $customer,
                $product,
                sprintf('ALD-RECENT-%03d', $index),
                $branch,
                'pending',
                'pickup',
                300 + $index,
            );
        }

        $product->update(['price' => 9999]);

        $this->withToken($staff->createToken('dashboard-recent-test')->plainTextToken)
            ->getJson('/api/staff/dashboard/data')
            ->assertOk()
            ->assertJsonCount(5, 'recent_orders')
            ->assertJsonPath('recent_orders.0.reference', 'ALD-RECENT-006')
            ->assertJsonPath('recent_orders.0.total_amount', 306)
            ->assertJsonPath('recent_orders.4.reference', 'ALD-RECENT-002');
    }

    public function test_dashboard_returns_truthful_zero_state_for_empty_branch(): void
    {
        $branch = $this->createBranch('Dashboard Empty Branch');
        $staff = $this->createStaff($branch);

        $this->withToken($staff->createToken('dashboard-empty-test')->plainTextToken)
            ->getJson('/api/staff/dashboard/data')
            ->assertOk()
            ->assertJsonPath('summary.active_orders', 0)
            ->assertJsonPath('summary.pending_orders', 0)
            ->assertJsonPath('summary.payments_attention', 0)
            ->assertJsonPath('summary.pickups_attention', 0)
            ->assertJsonPath('summary.deliveries_attention', 0)
            ->assertJsonPath('summary.conversations', 0)
            ->assertJsonCount(0, 'recent_orders')
            ->assertJsonCount(0, 'recent_conversations');
    }

    private function createStaff(Branch $branch): User
    {
        return User::create([
            'name' => 'Dashboard Staff User',
            'email' => 'dashboard-staff-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch->id,
            'status' => 'active',
            'role' => 'staff',
        ]);
    }

    private function createCustomer(string $name): Customer
    {
        return Customer::create([
            'full_name' => $name,
            'contact_number' => '09170000000',
            'email' => strtolower(str_replace(' ', '-', $name)).'@example.com',
        ]);
    }

    private function createProduct(string $partNumber, int $price): Product
    {
        $category = Category::create([
            'name' => 'Dashboard Test Category '.$partNumber,
        ]);

        return Product::create([
            'part_number' => $partNumber,
            'name' => 'Dashboard Test Product '.$partNumber,
            'description' => 'Dashboard test product',
            'category_id' => $category->id,
            'brand' => 'Dashboard Brand',
            'price' => $price,
            'img_url' => 'dashboard-test.png',
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
        string $fulfillment = 'pickup',
        int $total = 250,
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
            'address' => 'Dashboard test address',
            'contact_number' => '09170000000',
            'is_active' => true,
        ]);
    }
}
