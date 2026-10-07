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

class OrderRetrievalApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_customer_can_list_only_owned_orders_with_safe_scope_and_pagination(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('RET-001', 180.00);
        [$user, $customer] = $this->createCustomer('customer-a@example.com', '09171234567');
        [, $otherCustomer] = $this->createCustomer('customer-b@example.com', '09179876543');

        $this->createOrder($customer, $product, 'ALD-2026-000001', quantity: 2);
        $this->createOrder($otherCustomer, $product, 'ALD-2026-000002');
        $this->createOrder($customer, $product, 'ALD-2026-000003', status: 'completed');
        $latestOrder = $this->createOrder($customer, $product, 'ALD-2026-000004');
        Payment::create([
            'order_id' => $latestOrder->id,
            'payment_method' => 'online_payment',
            'amount' => $latestOrder->total_amount,
            'payment_status' => 'unpaid',
        ]);

        $token = $user->createToken('retrieval-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/customer/orders?per_page=1&page=1')
            ->assertOk()
            ->assertJsonCount(1, 'orders')
            ->assertJsonPath('orders.0.reference', 'ALD-2026-000004')
            ->assertJsonPath('orders.0.item_count', 1)
            ->assertJsonPath('orders.0.payment.method', 'online_payment')
            ->assertJsonPath('orders.0.payment.status', 'unpaid')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.total', 3);

        $this->withToken($token)
            ->getJson('/api/customer/orders?per_page=1&page=2')
            ->assertOk()
            ->assertJsonPath('orders.0.reference', 'ALD-2026-000003');

        $this->withToken($token)
            ->getJson('/api/customer/orders?scope=history')
            ->assertOk()
            ->assertJsonCount(1, 'orders')
            ->assertJsonPath('orders.0.status', 'completed');

        $this->withToken($token)
            ->getJson('/api/customer/orders?scope=active')
            ->assertOk()
            ->assertJsonCount(2, 'orders')
            ->assertJsonPath('meta.total', 2);

        $this->assertDatabaseHas('order_requests', [
            'branch_id' => $branch->id,
            'customer_id' => $customer->id,
        ]);
    }

    public function test_customer_list_requires_customer_authentication(): void
    {
        $this->getJson('/api/customer/orders')->assertUnauthorized();

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'retrieval-admin@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'admin',
        ]);

        $token = $admin->createToken('retrieval-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/customer/orders')
            ->assertForbidden();
    }

    public function test_customer_can_view_owned_detail_without_exposing_another_customer_order(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('RET-002', 180.00);
        [$user, $customer] = $this->createCustomer('detail-a@example.com', '09171111111');
        [, $otherCustomer] = $this->createCustomer('detail-b@example.com', '09172222222');
        $order = $this->createOrder($customer, $product, 'ALD-2026-000010', quantity: 2);
        $otherOrder = $this->createOrder($otherCustomer, $product, 'ALD-2026-000011');

        $product->update(['price' => 220.00]);
        $token = $user->createToken('retrieval-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/customer/orders/'.strtolower($order->order_reference))
            ->assertOk()
            ->assertJsonPath('order.reference', $order->order_reference)
            ->assertJsonPath('order.items.0.image', 'https://example.com/test-product.png')
            ->assertJsonPath('order.items.0.unit_price', 180)
            ->assertJsonPath('order.items.0.line_total', 360)
            ->assertJsonPath('order.total_amount', 360)
            ->assertJsonPath('order.payment', null)
            ->assertJsonPath('order.pickup.status', 'pending')
            ->assertJsonMissingPath('order.delivery');

        $this->withToken($token)
            ->getJson('/api/customer/orders/'.$otherOrder->order_reference)
            ->assertNotFound()
            ->assertJsonPath('message', 'Order not found.');

        $this->withToken($token)
            ->getJson('/api/customer/orders/ALD-2026-999999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Order not found.');
    }

    public function test_guest_tracking_requires_reference_and_matching_contact_number(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('RET-003', 350.00);
        [, $customer] = $this->createCustomer(null, '0917-333-3333', guestName: 'Guest Buyer');
        $order = $this->createOrder($customer, $product, 'ALD-2026-000020');

        $this->postJson('/api/order-requests/track', [
            'order_reference' => strtolower($order->order_reference),
            'contact_number' => '09173333333',
        ])
            ->assertOk()
            ->assertJsonPath('order.reference', $order->order_reference)
            ->assertJsonPath('order.pickup.branch_id', $branch->id)
            ->assertJsonMissingPath('order.customer');

        $this->postJson('/api/order-requests/track', [
            'order_reference' => $order->order_reference,
            'contact_number' => '09174444444',
        ])
            ->assertNotFound()
            ->assertJsonPath('message', 'Order not found or verification information is incorrect.');

        $this->postJson('/api/order-requests/track', [
            'order_reference' => $order->order_reference,
        ])->assertUnprocessable();

        $this->postJson('/api/order-requests/track', [
            'order_reference' => $order->order_reference,
            'contact_number' => '---',
        ])->assertUnprocessable();
    }

    public function test_guest_tracking_uses_the_reference_and_does_not_list_orders_by_phone(): void
    {
        $this->createBranch();
        $product = $this->createProduct('RET-004', 100.00);
        [, $firstCustomer] = $this->createCustomer(null, '09175555555', guestName: 'First Guest');
        [, $secondCustomer] = $this->createCustomer(null, '09175555555', guestName: 'Second Guest');
        $this->createOrder($firstCustomer, $product, 'ALD-2026-000030');
        $secondOrder = $this->createOrder($secondCustomer, $product, 'ALD-2026-000031');

        $response = $this->postJson('/api/order-requests/track', [
            'order_reference' => $secondOrder->order_reference,
            'contact_number' => '09175555555',
        ])->assertOk();

        $response->assertJsonPath('order.reference', $secondOrder->order_reference);
    }

    public function test_registered_order_can_also_be_tracked_with_the_linked_profile_contact(): void
    {
        $this->createBranch();
        $product = $this->createProduct('RET-004B', 125.00);
        [, $customer] = $this->createCustomer('registered-track@example.com', '0917 666 7777');
        $order = $this->createOrder($customer, $product, 'ALD-2026-000035');

        $this->postJson('/api/order-requests/track', [
            'order_reference' => $order->order_reference,
            'contact_number' => '09176667777',
        ])
            ->assertOk()
            ->assertJsonPath('order.reference', $order->order_reference);
    }

    public function test_delivery_detail_returns_persisted_delivery_state_without_pickup_or_fake_payment(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('RET-005', 480.00);
        [$user, $customer] = $this->createCustomer('delivery-detail@example.com', '09176666666');
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000040',
            fulfillmentType: 'delivery',
            delivery: [
                'delivery_address' => '12 Main Street, Barangay San Isidro, Makati City',
                'delivery_status' => 'waiting_for_booking',
                'booking_reference' => null,
                'tracking_url' => null,
                'rider_name' => null,
                'rider_contact' => null,
            ],
        );
        $token = $user->createToken('retrieval-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/customer/orders/'.$order->order_reference)
            ->assertOk()
            ->assertJsonPath('order.delivery.branch_id', $branch->id)
            ->assertJsonPath('order.delivery.address', '12 Main Street, Barangay San Isidro, Makati City')
            ->assertJsonPath('order.delivery.status', 'waiting_for_booking')
            ->assertJsonPath('order.delivery.booking_reference', null)
            ->assertJsonPath('order.payment', null)
            ->assertJsonMissingPath('order.pickup');
    }

    /**
     * @return array{0: User|null, 1: Customer}
     */
    private function createCustomer(?string $email, string $contactNumber, string $guestName = 'Registered Customer'): array
    {
        if ($email === null) {
            return [null, Customer::create([
                'user_id' => null,
                'full_name' => $guestName,
                'contact_number' => $contactNumber,
                'email' => strtolower(str_replace(' ', '.', $guestName)).'@example.com',
            ])];
        }

        $user = User::create([
            'name' => $guestName,
            'email' => $email,
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $customer = Customer::create([
            'user_id' => $user->id,
            'full_name' => $guestName,
            'contact_number' => $contactNumber,
            'email' => $email,
        ]);

        return [$user, $customer];
    }

    private function createOrder(
        Customer $customer,
        Product $product,
        string $reference,
        int $quantity = 1,
        string $status = 'pending',
        string $fulfillmentType = 'pickup',
        array $delivery = [],
    ): OrderRequest {
        $branch = Branch::query()->firstOrFail();
        $subtotal = (float) $product->price * $quantity;
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
            'quantity' => $quantity,
            'subtotal' => $subtotal,
        ]);

        if ($fulfillmentType === 'pickup') {
            PickupRequest::create([
                'order_id' => $order->id,
                'branch_id' => $branch->id,
                'pickup_status' => 'pending',
            ]);
        } else {
            DeliveryRequest::create(array_merge([
                'order_id' => $order->id,
                'branch_id' => $branch->id,
                'delivery_address' => 'Test delivery address',
                'delivery_fee' => 0,
                'delivery_status' => 'waiting_for_booking',
            ], $delivery));
        }

        return $order->fresh();
    }

    private function createBranch(): Branch
    {
        return Branch::create([
            'name' => 'Test Branch '.uniqid(),
            'address' => 'Test Branch Address',
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
