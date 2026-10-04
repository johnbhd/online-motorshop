<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\PickupRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffOrdersApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_staff_orders_requires_authentication(): void
    {
        $this->getJson('/api/staff/orders')->assertUnauthorized();
        $this->patchJson('/api/staff/orders/ALD-2026-000001/status', [
            'status' => 'under_review',
        ])->assertUnauthorized();
    }

    public function test_customer_cannot_access_staff_orders(): void
    {
        $customerUser = User::create([
            'name' => 'Customer User',
            'email' => 'staff-orders-customer@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $token = $customerUser->createToken('staff-orders-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/orders')
            ->assertForbidden();
    }

    public function test_staff_can_list_real_branch_scoped_orders_with_search_filters_and_pagination(): void
    {
        $branch = $this->createBranch('Makati Staff Branch');
        $otherBranch = $this->createBranch('Other Staff Branch');
        $product = $this->createProduct('STAFF-001', 180.00);
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Mark Reyes', '09171234567');
        $otherCustomer = $this->createCustomer('Other Customer', '09179999999');

        $this->createOrder($customer, $product, 'ALD-2026-000128', $branch, 'pending');
        $this->createOrder($customer, $product, 'ALD-2026-000127', $branch, 'confirmed');
        $this->createOrder($otherCustomer, $product, 'ALD-2026-000126', $otherBranch, 'pending');

        $token = $staff->createToken('staff-orders-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/orders?search=Mark&status=pending&fulfillment=pickup&per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonCount(1, 'orders')
            ->assertJsonPath('orders.0.reference', 'ALD-2026-000128')
            ->assertJsonPath('orders.0.customer.full_name', 'Mark Reyes')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.last_page', 1)
            ->assertJsonPath('meta.total', 1);

        $this->withToken($token)
            ->getJson('/api/staff/orders/data')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonCount(2, 'orders');
    }

    public function test_staff_detail_uses_historical_item_prices_and_handles_null_payment(): void
    {
        $branch = $this->createBranch('Detail Staff Branch');
        $product = $this->createProduct('STAFF-002', 180.00);
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Detail Customer', '09171111111');
        $order = $this->createOrder($customer, $product, 'ALD-2026-000125', $branch);
        $product->update(['price' => 220.00]);
        $token = $staff->createToken('staff-orders-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/orders/'.strtolower($order->order_reference))
            ->assertOk()
            ->assertJsonPath('order.reference', $order->order_reference)
            ->assertJsonPath('order.customer.full_name', 'Detail Customer')
            ->assertJsonPath('order.items.0.unit_price', 180)
            ->assertJsonPath('order.items.0.line_total', 180)
            ->assertJsonPath('order.payment', null)
            ->assertJsonPath('order.pickup.status', 'pending')
            ->assertJsonPath('order.allowed_statuses.0', 'under_review');
    }

    public function test_staff_can_update_review_status_without_fulfillment_side_effects(): void
    {
        $branch = $this->createBranch('Status Staff Branch');
        $product = $this->createProduct('STAFF-003', 200.00);
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Status Customer', '09172222222');
        $order = $this->createOrder($customer, $product, 'ALD-2026-000124', $branch);
        $pickup = $order->pickupRequest;
        $token = $staff->createToken('staff-orders-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/staff/orders/'.$order->order_reference.'/status', [
                'status' => 'under_review',
            ])
            ->assertOk()
            ->assertJsonPath('order.status', 'under_review')
            ->assertJsonPath('message', 'Order status updated.');

        $this->assertDatabaseHas('order_requests', [
            'id' => $order->id,
            'order_status' => 'under_review',
        ]);
        $this->assertDatabaseHas('pickup_requests', [
            'id' => $pickup->id,
            'pickup_status' => 'pending',
        ]);
    }

    public function test_invalid_status_value_and_transition_are_rejected(): void
    {
        $branch = $this->createBranch('Invalid Status Branch');
        $product = $this->createProduct('STAFF-004', 210.00);
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Invalid Status Customer', '09173333333');
        $order = $this->createOrder($customer, $product, 'ALD-2026-000123', $branch, 'completed');
        $token = $staff->createToken('staff-orders-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/staff/orders/'.$order->order_reference.'/status', [
                'status' => 'not-a-status',
            ])
            ->assertUnprocessable();

        $this->withToken($token)
            ->patchJson('/api/staff/orders/'.$order->order_reference.'/status', [
                'status' => 'pending',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('order_requests', [
            'id' => $order->id,
            'order_status' => 'completed',
        ]);
    }

    public function test_staff_cannot_view_an_order_from_another_branch(): void
    {
        $branch = $this->createBranch('Scoped Staff Branch');
        $otherBranch = $this->createBranch('Hidden Staff Branch');
        $product = $this->createProduct('STAFF-005', 220.00);
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Hidden Customer', '09174444444');
        $order = $this->createOrder($customer, $product, 'ALD-2026-000122', $otherBranch);
        $token = $staff->createToken('staff-orders-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/orders/'.$order->order_reference)
            ->assertNotFound();

        $this->withToken($token)
            ->getJson('/api/staff/orders?search=Hidden')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    private function createStaff(Branch $branch): User
    {
        return User::create([
            'name' => 'Staff User',
            'email' => 'staff-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch->id,
            'status' => 'active',
            'role' => 'staff',
        ]);
    }

    private function createCustomer(string $name, string $contact): Customer
    {
        return Customer::create([
            'full_name' => $name,
            'contact_number' => $contact,
            'email' => strtolower(str_replace(' ', '.', $name)).'@example.com',
        ]);
    }

    private function createOrder(
        Customer $customer,
        Product $product,
        string $reference,
        Branch $branch,
        string $status = 'pending',
        string $fulfillmentType = 'pickup',
    ): OrderRequest {
        $subtotal = (float) $product->price;
        $order = OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => $fulfillmentType,
            'order_status' => $status,
            'subtotal' => $subtotal,
            'delivery_fee' => 0,
            'total_amount' => $subtotal,
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'unit_price' => $product->price,
            'quantity' => 1,
            'subtotal' => $subtotal,
        ]);

        PickupRequest::create([
            'order_id' => $order->id,
            'branch_id' => $branch->id,
            'pickup_status' => 'pending',
        ]);

        return $order->fresh('pickupRequest');
    }

    private function createBranch(string $name): Branch
    {
        return Branch::create([
            'name' => $name,
            'address' => 'Test branch address',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ]);
    }

    private function createProduct(string $partNumber, float $price): Product
    {
        $category = Category::firstOrCreate([
            'name' => 'Test Parts',
        ], [
            'description' => 'Test category',
            'status' => 'active',
        ]);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Test Product '.$partNumber,
            'part_number' => $partNumber,
            'brand' => 'Test Brand',
            'description' => 'Test product description',
            'price' => $price,
            'img_url' => 'https://example.com/test-product.png',
            'availability_status' => 'active',
            'status' => 'active',
        ]);
    }
}
