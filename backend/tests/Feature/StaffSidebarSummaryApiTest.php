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

class StaffSidebarSummaryApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_sidebar_summary_requires_staff_authentication(): void
    {
        $this->getJson('/api/staff/sidebar-summary')->assertUnauthorized();

        $customer = User::create([
            'name' => 'Sidebar Customer',
            'email' => 'sidebar-customer-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);

        $this->withToken($customer->createToken('sidebar-test')->plainTextToken)
            ->getJson('/api/staff/sidebar-summary')
            ->assertForbidden();
    }

    public function test_staff_sidebar_summary_is_real_and_branch_scoped(): void
    {
        $branch = $this->createBranch('Sidebar Staff Branch');
        $otherBranch = $this->createBranch('Sidebar Other Branch');
        $staff = $this->createStaff($branch);
        $customer = Customer::create([
            'full_name' => 'Sidebar Customer',
            'contact_number' => '09171234567',
            'email' => 'sidebar-customer@example.com',
        ]);
        $category = Category::create([
            'name' => 'Sidebar Test Category',
        ]);
        $product = Product::create([
            'part_number' => 'SIDEBAR-001',
            'name' => 'Sidebar Test Product',
            'description' => 'Sidebar test product',
            'category_id' => $category->id,
            'brand' => 'Sidebar Brand',
            'price' => 250,
            'img_url' => 'sidebar-test.png',
            'availability_status' => 'active',
            'status' => 'active',
        ]);

        $pendingOrder = $this->createOrder($customer, $product, 'ALD-SIDEBAR-001', $branch, 'pending');
        $paymentOrder = $this->createOrder($customer, $product, 'ALD-SIDEBAR-002', $branch, 'confirmed');
        $pickupOrder = $this->createOrder($customer, $product, 'ALD-SIDEBAR-003', $branch, 'confirmed');
        $deliveryOrder = $this->createOrder($customer, $product, 'ALD-SIDEBAR-004', $branch, 'confirmed');
        $completedDeliveryOrder = $this->createOrder($customer, $product, 'ALD-SIDEBAR-005', $branch, 'completed');
        $otherBranchOrder = $this->createOrder($customer, $product, 'ALD-SIDEBAR-006', $otherBranch, 'pending');

        Payment::create([
            'order_id' => $paymentOrder->id,
            'payment_method' => 'Online Payment',
            'amount' => 250,
            'payment_status' => 'waiting_for_verification',
        ]);
        PickupRequest::create([
            'order_id' => $pickupOrder->id,
            'branch_id' => $branch->id,
            'pickup_status' => 'preparing',
        ]);
        DeliveryRequest::create([
            'order_id' => $deliveryOrder->id,
            'branch_id' => $branch->id,
            'delivery_address' => 'Sidebar delivery address',
            'delivery_status' => 'waiting_for_booking',
        ]);
        DeliveryRequest::create([
            'order_id' => $completedDeliveryOrder->id,
            'branch_id' => $branch->id,
            'delivery_address' => 'Completed delivery address',
            'delivery_status' => 'delivered',
        ]);
        PickupRequest::create([
            'order_id' => $otherBranchOrder->id,
            'branch_id' => $otherBranch->id,
            'pickup_status' => 'pending',
        ]);

        $conversation = Conversation::create([
            'guest_token_hash' => hash('sha256', 'sidebar-guest-token'),
            'participant_type' => 'guest',
            'status' => 'open',
        ]);
        $conversation->messages()->create([
            'sender_type' => 'customer',
            'body' => 'I need help with my order.',
        ]);

        $response = $this->withToken($staff->createToken('sidebar-test')->plainTextToken)
            ->getJson('/api/staff/sidebar-summary')
            ->assertOk()
            ->assertJsonPath('counts.orders', 1)
            ->assertJsonPath('counts.payments', 1)
            ->assertJsonPath('counts.pickup_requests', 1)
            ->assertJsonPath('counts.delivery_requests', 1)
            ->assertJsonPath('counts.messages', 1);
    }

    private function createStaff(Branch $branch): User
    {
        return User::create([
            'name' => 'Sidebar Staff User',
            'email' => 'sidebar-staff-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch->id,
            'status' => 'active',
            'role' => 'staff',
        ]);
    }

    private function createOrder(
        Customer $customer,
        Product $product,
        string $reference,
        Branch $branch,
        string $status,
    ): OrderRequest {
        $order = OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => 'pickup',
            'order_status' => $status,
            'subtotal' => 250,
            'delivery_fee' => 0,
            'total_amount' => 250,
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'unit_price' => 250,
            'quantity' => 1,
            'subtotal' => 250,
        ]);

        return $order;
    }

    private function createBranch(string $name): Branch
    {
        return Branch::create([
            'name' => $name,
            'address' => 'Sidebar test address',
            'contact_number' => '09170000000',
            'is_active' => true,
        ]);
    }
}
