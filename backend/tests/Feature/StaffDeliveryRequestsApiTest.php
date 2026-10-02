<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
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

class StaffDeliveryRequestsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_staff_deliveries_require_authentication(): void
    {
        $this->getJson('/api/staff/delivery-requests')->assertUnauthorized();
        $this->getJson('/api/staff/delivery-requests/data')->assertUnauthorized();
        $this->patchJson('/api/staff/delivery-requests/1/status', [
            'status' => 'booked',
        ])->assertUnauthorized();
    }

    public function test_customer_cannot_access_staff_deliveries(): void
    {
        $customer = User::create([
            'name' => 'Delivery Customer User',
            'email' => 'delivery-customer-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $token = $customer->createToken('staff-delivery-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/delivery-requests')
            ->assertForbidden();
    }

    public function test_staff_list_is_branch_scoped_searchable_filterable_and_paginated(): void
    {
        $branch = $this->createBranch('Makati Delivery Branch');
        $otherBranch = $this->createBranch('Other Delivery Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Delivery Mark Reyes', '09171234567');
        $otherCustomer = $this->createCustomer('Hidden Delivery Customer', '09179999999');
        $product = $this->createProduct('DELIVERY-001', 250.00);

        $firstOrder = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000228',
            $branch,
        );
        $secondOrder = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000227',
            $branch,
        );
        $otherOrder = $this->createOrder(
            $otherCustomer,
            $product,
            'ALD-2026-000226',
            $otherBranch,
        );

        $firstOrder->deliveryRequest()->update([
            'delivery_status' => 'booked',
            'booking_reference' => 'LAL-228',
        ]);
        $secondOrder->deliveryRequest()->update([
            'delivery_status' => 'delivered',
        ]);
        $otherOrder->deliveryRequest()->update([
            'delivery_status' => 'in_transit',
        ]);

        Payment::create([
            'order_id' => $firstOrder->id,
            'payment_method' => 'Online Payment',
            'amount' => 250.00,
            'payment_status' => 'waiting_for_verification',
        ]);

        $token = $staff->createToken('staff-delivery-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/delivery-requests?search=LAL-228&status=booked&per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonPath('summary.booked', 1)
            ->assertJsonPath('summary.delivered', 1)
            ->assertJsonPath('summary.in_transit', 0)
            ->assertJsonCount(1, 'delivery_requests')
            ->assertJsonPath('delivery_requests.0.order_reference', 'ALD-2026-000228')
            ->assertJsonPath('delivery_requests.0.customer.full_name', 'Delivery Mark Reyes')
            ->assertJsonPath('delivery_requests.0.payment.status', 'waiting_for_verification')
            ->assertJsonPath('delivery_requests.0.booking_reference', 'LAL-228')
            ->assertJsonPath('meta.total', 1);

        $this->withToken($token)
            ->getJson('/api/staff/delivery-requests?per_page=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(1, 'delivery_requests');
    }

    public function test_staff_delivery_details_use_address_snapshots_historical_prices_and_null_payment(): void
    {
        $branch = $this->createBranch('Delivery Detail Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Delivery Detail Customer', '09171111111');
        $product = $this->createProduct('DELIVERY-002', 180.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000225',
            $branch,
        );
        $delivery = $order->deliveryRequest;
        $delivery->update([
            'booking_reference' => 'LAL-225',
            'tracking_url' => 'https://tracking.example.test/LAL-225',
            'rider_name' => 'Rider One',
            'rider_contact' => '09170000001',
            'remarks' => 'Call on arrival',
        ]);
        $product->update([
            'price' => 220.00,
        ]);
        $token = $staff->createToken('staff-delivery-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/delivery-requests/'.$delivery->id)
            ->assertOk()
            ->assertJsonPath('delivery_request.order_reference', 'ALD-2026-000225')
            ->assertJsonPath('delivery_request.customer.full_name', 'Delivery Detail Customer')
            ->assertJsonPath('delivery_request.delivery_address', '12 Main Street, Barangay San Isidro, Makati City')
            ->assertJsonPath('delivery_request.amount', 180)
            ->assertJsonPath('delivery_request.payment', null)
            ->assertJsonPath('delivery_request.order.items.0.unit_price', 180)
            ->assertJsonPath('delivery_request.order.items.0.part_number', 'DELIVERY-002')
            ->assertJsonPath('delivery_request.booking_reference', 'LAL-225')
            ->assertJsonPath('delivery_request.rider_name', 'Rider One')
            ->assertJsonPath('delivery_request.allowed_statuses.0', 'booked')
            ->assertJsonPath('delivery_request.allowed_statuses.1', 'cancelled');
    }

    public function test_staff_can_progress_delivery_with_manual_booking_and_rider_data(): void
    {
        $branch = $this->createBranch('Delivery Status Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Delivery Status Customer', '09172222222');
        $product = $this->createProduct('DELIVERY-003', 200.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000224',
            $branch,
            'confirmed',
        );
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'Pay at Delivery',
            'amount' => 200.00,
            'payment_status' => 'unpaid',
        ]);
        $pickupCount = PickupRequest::count();
        $token = $staff->createToken('staff-delivery-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/staff/delivery-requests/'.$order->deliveryRequest->id.'/status', [
                'status' => 'booked',
                'booking_reference' => 'LAL-224',
                'tracking_url' => 'https://tracking.example.test/LAL-224',
            ])
            ->assertOk()
            ->assertJsonPath('delivery_request.delivery_status', 'booked')
            ->assertJsonPath('delivery_request.booking_reference', 'LAL-224')
            ->assertJsonPath('delivery_request.allowed_statuses.0', 'picked_up');

        $this->withToken($token)
            ->patchJson('/api/staff/delivery-requests/'.$order->deliveryRequest->id.'/status', [
                'status' => 'picked_up',
                'rider_name' => 'Rider Two',
                'rider_contact' => '09170000002',
            ])
            ->assertOk()
            ->assertJsonPath('delivery_request.delivery_status', 'picked_up')
            ->assertJsonPath('delivery_request.rider_name', 'Rider Two');

        $this->withToken($token)
            ->patchJson('/api/staff/delivery-requests/'.$order->deliveryRequest->id.'/status', [
                'status' => 'in_transit',
            ])
            ->assertOk()
            ->assertJsonPath('delivery_request.delivery_status', 'in_transit');

        $this->withToken($token)
            ->patchJson('/api/staff/delivery-requests/'.$order->deliveryRequest->id.'/status', [
                'status' => 'delivered',
                'remarks' => 'Delivered to customer.',
            ])
            ->assertOk()
            ->assertJsonPath('delivery_request.delivery_status', 'delivered')
            ->assertJsonPath('delivery_request.allowed_statuses', []);

        $this->assertDatabaseHas('delivery_requests', [
            'id' => $order->deliveryRequest->id,
            'delivery_status' => 'delivered',
            'booking_reference' => 'LAL-224',
            'rider_name' => 'Rider Two',
        ]);
        $this->assertNotNull($order->deliveryRequest->fresh()->delivered_at);
        $this->assertSame($pickupCount, PickupRequest::count());
        $this->assertDatabaseHas('order_requests', [
            'id' => $order->id,
            'order_status' => 'confirmed',
        ]);
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'payment_status' => 'unpaid',
        ]);
    }

    public function test_booking_reference_and_invalid_transitions_are_rejected(): void
    {
        $branch = $this->createBranch('Invalid Delivery Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Invalid Delivery Customer', '09173333333');
        $product = $this->createProduct('DELIVERY-004', 210.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000223',
            $branch,
        );
        $token = $staff->createToken('staff-delivery-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/staff/delivery-requests/'.$order->deliveryRequest->id.'/status', [
                'status' => 'booked',
            ])
            ->assertUnprocessable();

        $this->withToken($token)
            ->patchJson('/api/staff/delivery-requests/'.$order->deliveryRequest->id.'/status', [
                'status' => 'delivered',
            ])
            ->assertUnprocessable();

        $this->withToken($token)
            ->patchJson('/api/staff/delivery-requests/'.$order->deliveryRequest->id.'/status', [
                'status' => 'not-a-status',
            ])
            ->assertUnprocessable();

        $order->deliveryRequest()->update([
            'delivery_status' => 'delivered',
        ]);

        $this->withToken($token)
            ->patchJson('/api/staff/delivery-requests/'.$order->deliveryRequest->id.'/status', [
                'status' => 'booked',
                'booking_reference' => 'LAL-OLD',
            ])
            ->assertUnprocessable();
    }

    public function test_staff_cannot_view_or_update_delivery_from_another_branch(): void
    {
        $branch = $this->createBranch('Scoped Delivery Branch');
        $otherBranch = $this->createBranch('Hidden Delivery Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Hidden Delivery Customer', '09174444444');
        $product = $this->createProduct('DELIVERY-005', 220.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000222',
            $otherBranch,
        );
        $token = $staff->createToken('staff-delivery-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/delivery-requests/'.$order->deliveryRequest->id)
            ->assertNotFound();

        $this->withToken($token)
            ->patchJson('/api/staff/delivery-requests/'.$order->deliveryRequest->id.'/status', [
                'status' => 'booked',
                'booking_reference' => 'LAL-HIDDEN',
            ])
            ->assertNotFound();

        $this->withToken($token)
            ->getJson('/api/staff/delivery-requests?search=Hidden')
            ->assertOk()
            ->assertJsonPath('meta.total', 0);
    }

    private function createStaff(Branch $branch): User
    {
        return User::create([
            'name' => 'Delivery Staff User',
            'email' => 'delivery-staff-'.uniqid().'@example.com',
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
            'fulfillment_type' => 'delivery',
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

        DeliveryRequest::create([
            'order_id' => $order->id,
            'branch_id' => $branch->id,
            'delivery_address' => '12 Main Street, Barangay San Isidro, Makati City',
            'delivery_fee' => 0,
            'delivery_status' => 'waiting_for_booking',
            'remarks' => 'Call on arrival',
        ]);

        return $order->fresh('deliveryRequest');
    }

    private function createBranch(string $name): Branch
    {
        return Branch::create([
            'name' => $name,
            'address' => 'Test delivery branch address',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ]);
    }

    private function createProduct(string $partNumber, float $price): Product
    {
        $category = Category::firstOrCreate([
            'name' => 'Test Delivery Parts',
        ], [
            'description' => 'Test delivery category',
            'status' => 'active',
        ]);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Test Delivery Product '.$partNumber,
            'part_number' => $partNumber,
            'brand' => 'Test Brand',
            'description' => 'Test delivery product description',
            'price' => $price,
            'img_url' => 'https://example.com/test-delivery-product.png',
            'availability_status' => 'active',
            'status' => 'active',
        ]);
    }
}
