<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffPickupRequestsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_staff_pickups_require_authentication(): void
    {
        $this->getJson('/api/staff/pickup-requests')->assertUnauthorized();
        $this->getJson('/api/staff/pickup-requests/data')->assertUnauthorized();
        $this->patchJson('/api/staff/pickup-requests/1/status', [
            'status' => 'preparing',
        ])->assertUnauthorized();
    }

    public function test_customer_cannot_access_staff_pickups(): void
    {
        $customer = User::create([
            'name' => 'Pickup Customer User',
            'email' => 'pickup-customer-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $token = $customer->createToken('staff-pickup-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/pickup-requests')
            ->assertForbidden();
    }

    public function test_staff_list_is_branch_scoped_searchable_filterable_and_paginated(): void
    {
        $branch = $this->createBranch('Makati Pickup Branch');
        $otherBranch = $this->createBranch('Other Pickup Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Pickup Mark Reyes', '09171234567');
        $otherCustomer = $this->createCustomer('Hidden Pickup Customer', '09179999999');
        $product = $this->createProduct('PICKUP-001', 250.00);

        $firstOrder = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000128',
            $branch,
        );
        $secondOrder = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000127',
            $branch,
        );
        $otherOrder = $this->createOrder(
            $otherCustomer,
            $product,
            'ALD-2026-000126',
            $otherBranch,
        );

        $firstOrder->pickupRequest()->update([
            'pickup_status' => 'preparing',
        ]);
        $secondOrder->pickupRequest()->update([
            'pickup_status' => 'completed',
        ]);
        $otherOrder->pickupRequest()->update([
            'pickup_status' => 'ready_for_pickup',
        ]);

        Payment::create([
            'order_id' => $firstOrder->id,
            'payment_method' => 'Online Payment',
            'amount' => 250.00,
            'payment_status' => 'waiting_for_verification',
        ]);

        $token = $staff->createToken('staff-pickup-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/pickup-requests?search=ALD-2026-000128&status=preparing&per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonPath('summary.preparing', 1)
            ->assertJsonPath('summary.completed', 1)
            ->assertJsonPath('summary.ready_for_pickup', 0)
            ->assertJsonCount(1, 'pickup_requests')
            ->assertJsonPath('pickup_requests.0.order_reference', 'ALD-2026-000128')
            ->assertJsonPath('pickup_requests.0.customer.full_name', 'Pickup Mark Reyes')
            ->assertJsonPath('pickup_requests.0.payment.status', 'waiting_for_verification')
            ->assertJsonPath('meta.total', 1);

        $this->withToken($token)
            ->getJson('/api/staff/pickup-requests?per_page=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(1, 'pickup_requests');
    }

    public function test_staff_pickup_details_use_real_data_historical_prices_and_null_payment(): void
    {
        $branch = $this->createBranch('Pickup Detail Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Pickup Detail Customer', '09171111111');
        $product = $this->createProduct('PICKUP-002', 180.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000125',
            $branch,
        );
        $product->update([
            'price' => 220.00,
        ]);
        $token = $staff->createToken('staff-pickup-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/pickup-requests/'.$order->pickupRequest->id)
            ->assertOk()
            ->assertJsonPath('pickup_request.order_reference', 'ALD-2026-000125')
            ->assertJsonPath('pickup_request.customer.full_name', 'Pickup Detail Customer')
            ->assertJsonPath('pickup_request.amount', 180)
            ->assertJsonPath('pickup_request.payment', null)
            ->assertJsonPath('pickup_request.order.items.0.unit_price', 180)
            ->assertJsonPath('pickup_request.order.items.0.part_number', 'PICKUP-002')
            ->assertJsonPath('pickup_request.pickup_status', 'pending')
            ->assertJsonPath('pickup_request.allowed_statuses.0', 'preparing');
    }

    public function test_staff_can_progress_pickup_without_mutating_order_or_payment(): void
    {
        $branch = $this->createBranch('Pickup Status Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Pickup Status Customer', '09172222222');
        $product = $this->createProduct('PICKUP-003', 200.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000124',
            $branch,
            'confirmed',
        );
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'Pay at Pickup',
            'amount' => 200.00,
            'payment_status' => 'unpaid',
        ]);
        $token = $staff->createToken('staff-pickup-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/staff/pickup-requests/'.$order->pickupRequest->id.'/status', [
                'status' => 'preparing',
            ])
            ->assertOk()
            ->assertJsonPath('pickup_request.pickup_status', 'preparing')
            ->assertJsonPath('pickup_request.allowed_statuses.0', 'ready_for_pickup');

        $this->withToken($token)
            ->patchJson('/api/staff/pickup-requests/'.$order->pickupRequest->id.'/status', [
                'status' => 'ready_for_pickup',
            ])
            ->assertOk()
            ->assertJsonPath('pickup_request.pickup_status', 'ready_for_pickup');

        $this->withToken($token)
            ->patchJson('/api/staff/pickup-requests/'.$order->pickupRequest->id.'/status', [
                'status' => 'completed',
            ])
            ->assertOk()
            ->assertJsonPath('pickup_request.pickup_status', 'completed')
            ->assertJsonPath('pickup_request.allowed_statuses', []);

        $this->assertDatabaseHas('pickup_requests', [
            'id' => $order->pickupRequest->id,
            'pickup_status' => 'completed',
        ]);
        $this->assertNotNull($order->pickupRequest->fresh()->completed_at);
        $this->assertDatabaseHas('order_requests', [
            'id' => $order->id,
            'order_status' => 'confirmed',
        ]);
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'payment_status' => 'unpaid',
        ]);
    }

    public function test_invalid_status_and_transition_are_rejected(): void
    {
        $branch = $this->createBranch('Invalid Pickup Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Invalid Pickup Customer', '09173333333');
        $product = $this->createProduct('PICKUP-004', 210.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000123',
            $branch,
        );
        $token = $staff->createToken('staff-pickup-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/staff/pickup-requests/'.$order->pickupRequest->id.'/status', [
                'status' => 'not-a-status',
            ])
            ->assertUnprocessable();

        $this->withToken($token)
            ->patchJson('/api/staff/pickup-requests/'.$order->pickupRequest->id.'/status', [
                'status' => 'completed',
            ])
            ->assertUnprocessable();

        $order->pickupRequest()->update([
            'pickup_status' => 'completed',
        ]);

        $this->withToken($token)
            ->patchJson('/api/staff/pickup-requests/'.$order->pickupRequest->id.'/status', [
                'status' => 'preparing',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('pickup_requests', [
            'id' => $order->pickupRequest->id,
            'pickup_status' => 'completed',
        ]);
    }

    public function test_staff_cannot_view_or_update_pickup_from_another_branch(): void
    {
        $branch = $this->createBranch('Scoped Pickup Branch');
        $otherBranch = $this->createBranch('Hidden Pickup Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Hidden Pickup Customer', '09174444444');
        $product = $this->createProduct('PICKUP-005', 220.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000122',
            $otherBranch,
        );
        $token = $staff->createToken('staff-pickup-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/pickup-requests/'.$order->pickupRequest->id)
            ->assertNotFound();

        $this->withToken($token)
            ->patchJson('/api/staff/pickup-requests/'.$order->pickupRequest->id.'/status', [
                'status' => 'preparing',
            ])
            ->assertNotFound();

        $this->withToken($token)
            ->getJson('/api/staff/pickup-requests?search=Hidden')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    private function createStaff(Branch $branch): User
    {
        return User::create([
            'name' => 'Pickup Staff User',
            'email' => 'pickup-staff-'.uniqid().'@example.com',
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
    ): OrderRequest {
        $subtotal = (float) $product->price;
        $order = OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => 'pickup',
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
            'address' => 'Test pickup branch address',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ]);
    }

    private function createProduct(string $partNumber, float $price): Product
    {
        $category = Category::firstOrCreate([
            'name' => 'Test Pickup Parts',
        ], [
            'description' => 'Test pickup category',
            'status' => 'active',
        ]);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Test Pickup Product '.$partNumber,
            'part_number' => $partNumber,
            'brand' => 'Test Brand',
            'description' => 'Test pickup product description',
            'price' => $price,
            'img_url' => 'https://example.com/test-pickup-product.png',
            'availability_status' => 'active',
            'status' => 'active',
        ]);
    }
}
