<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OrderRequestApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_guest_pickup_creates_a_pending_order_using_database_prices(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('HON-001', 180.00);

        $response = $this->postJson('/api/order-requests', [
            'customer' => [
                'name' => 'Guest Buyer',
                'email' => 'guest@example.com',
                'contact_number' => '09171234567',
            ],
            'items' => [[
                'part_number' => $product->part_number,
                'quantity' => 2,
                'price' => 1,
                'subtotal' => 1,
            ]],
            'payment_method' => 'pay_at_pickup',
            'fulfillment' => [
                'method' => 'pickup',
                'branch_id' => $branch->id,
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('order.reference', fn (string $reference): bool => (bool) preg_match('/^ALD-\d{4}-\d{6}$/', $reference))
            ->assertJsonPath('order.status', 'pending')
            ->assertJsonPath('order.payment_status', 'unpaid')
            ->assertJsonPath('order.payment.method', 'pay_at_pickup')
            ->assertJsonPath('order.payment.status', 'unpaid')
            ->assertJsonPath('order.fulfillment_method', 'pickup')
            ->assertJsonPath('order.subtotal', 360)
            ->assertJsonPath('order.estimated_total', 360)
            ->assertJsonPath('order.items.0.image', 'https://example.com/test-product.png')
            ->assertJsonPath('order.items.0.unit_price', 180)
            ->assertJsonPath('order.items.0.line_total', 360)
            ->assertJsonPath('order.pickup.status', 'pending');

        $this->assertDatabaseHas('customers', [
            'user_id' => null,
            'email' => 'guest@example.com',
        ]);
        $this->assertDatabaseHas('order_requests', [
            'fulfillment_type' => 'pickup',
            'order_status' => 'pending',
            'subtotal' => '360.00',
            'total_amount' => '360.00',
        ]);
        $this->assertDatabaseHas('payments', [
            'payment_method' => 'pay_at_pickup',
            'amount' => '360.00',
            'payment_status' => 'unpaid',
        ]);
        $this->assertDatabaseHas('pickup_requests', [
            'branch_id' => $branch->id,
            'pickup_status' => 'pending',
        ]);
        $this->assertDatabaseCount('delivery_requests', 0);
    }

    public function test_guest_delivery_creates_only_a_waiting_delivery_request(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('HON-002', 350.00);

        $response = $this->postJson('/api/order-requests', [
            'customer' => [
                'name' => 'Delivery Guest',
                'email' => 'delivery@example.com',
                'contact_number' => '09179876543',
            ],
            'items' => [[
                'part_number' => $product->part_number,
                'quantity' => 1,
            ]],
            'payment_method' => 'online_payment',
            'fulfillment' => [
                'method' => 'delivery',
                'branch_id' => $branch->id,
                'delivery' => [
                    'address' => '12 Main Street',
                    'barangay' => 'San Isidro',
                    'city' => 'Makati City',
                    'contact_person' => 'Delivery Guest',
                    'notes' => 'Call on arrival',
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('order.payment.method', 'online_payment')
            ->assertJsonPath('order.payment.status', 'unpaid')
            ->assertJsonPath('order.fulfillment_method', 'delivery')
            ->assertJsonPath('order.delivery.status', 'waiting_for_booking')
            ->assertJsonPath('order.delivery.address', '12 Main Street, Barangay San Isidro, Makati City')
            ->assertJsonPath('order.delivery.remarks', "Contact person: Delivery Guest\nNotes: Call on arrival");

        $this->assertDatabaseHas('delivery_requests', [
            'branch_id' => $branch->id,
            'delivery_status' => 'waiting_for_booking',
            'delivery_address' => '12 Main Street, Barangay San Isidro, Makati City',
        ]);
        $this->assertDatabaseCount('pickup_requests', 0);
    }

    public function test_registered_customer_order_uses_the_linked_profile(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('HON-003', 480.00);
        $user = User::create([
            'name' => 'Registered User',
            'email' => 'registered@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $customer = Customer::create([
            'user_id' => $user->id,
            'full_name' => 'Profile Name',
            'contact_number' => '09170000000',
            'email' => 'profile@example.com',
        ]);
        $token = $user->createToken('order-test')->plainTextToken;

        $response = $this->withToken($token)->postJson('/api/order-requests', [
            'customer' => [
                'name' => 'Tampered Name',
                'email' => 'tampered@example.com',
                'contact_number' => '09000000000',
            ],
            'items' => [[
                'part_number' => $product->part_number,
                'quantity' => 1,
            ]],
            'payment_method' => 'pay_at_pickup',
            'fulfillment' => [
                'method' => 'pickup',
                'branch_id' => $branch->id,
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('order.customer.id', $customer->id)
            ->assertJsonPath('order.customer.full_name', 'Profile Name')
            ->assertJsonPath('order.customer.email', 'profile@example.com');

        $this->assertDatabaseCount('customers', 1);
        $this->assertDatabaseHas('order_requests', [
            'customer_id' => $customer->id,
        ]);
    }

    public function test_multiple_products_are_calculated_from_current_prices(): void
    {
        $branch = $this->createBranch();
        $first = $this->createProduct('HON-004', 220.00);
        $second = $this->createProduct('HON-005', 1450.00);

        $response = $this->postJson('/api/order-requests', [
            'customer' => [
                'name' => 'Multi Product Buyer',
                'email' => 'multi@example.com',
                'contact_number' => '09171111111',
            ],
            'items' => [
                ['part_number' => $first->part_number, 'quantity' => 2],
                ['part_number' => $second->part_number, 'quantity' => 1],
            ],
            'payment_method' => 'pay_at_pickup',
            'fulfillment' => [
                'method' => 'pickup',
                'branch_id' => $branch->id,
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('order.subtotal', 1890)
            ->assertJsonCount(2, 'order.items');

        $this->assertDatabaseCount('order_items', 2);
    }

    public function test_inactive_or_unknown_products_are_rejected_without_writes(): void
    {
        $branch = $this->createBranch();
        $this->createProduct('INACTIVE-001', 100.00, ['status' => 'inactive']);

        $response = $this->postJson('/api/order-requests', [
            'customer' => [
                'name' => 'Unavailable Buyer',
                'email' => 'unavailable@example.com',
                'contact_number' => '09172222222',
            ],
            'items' => [
                ['part_number' => 'INACTIVE-001', 'quantity' => 1],
                ['part_number' => 'UNKNOWN-001', 'quantity' => 1],
            ],
            'payment_method' => 'pay_at_pickup',
            'fulfillment' => [
                'method' => 'pickup',
                'branch_id' => $branch->id,
            ],
        ]);

        $response->assertUnprocessable();
        $this->assertDatabaseCount('customers', 0);
        $this->assertDatabaseCount('order_requests', 0);
        $this->assertDatabaseCount('order_items', 0);
    }

    public function test_invalid_quantity_and_duplicate_items_are_rejected(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('HON-006', 1050.00);

        $this->postJson('/api/order-requests', [
            'customer' => [
                'name' => 'Invalid Buyer',
                'email' => 'invalid@example.com',
                'contact_number' => '09173333333',
            ],
            'items' => [['part_number' => $product->part_number, 'quantity' => 0]],
            'payment_method' => 'pay_at_pickup',
            'fulfillment' => ['method' => 'pickup', 'branch_id' => $branch->id],
        ])->assertUnprocessable();

        $this->postJson('/api/order-requests', [
            'customer' => [
                'name' => 'Duplicate Buyer',
                'email' => 'duplicate@example.com',
                'contact_number' => '09174444444',
            ],
            'items' => [
                ['part_number' => $product->part_number, 'quantity' => 1],
                ['part_number' => $product->part_number, 'quantity' => 1],
            ],
            'payment_method' => 'pay_at_pickup',
            'fulfillment' => ['method' => 'pickup', 'branch_id' => $branch->id],
        ])->assertUnprocessable();

        $this->assertDatabaseCount('order_requests', 0);
    }

    public function test_pickup_requires_a_pickup_enabled_branch(): void
    {
        $branch = $this->createBranch(['pickup_available' => false]);
        $product = $this->createProduct('HON-007', 1550.00);

        $response = $this->postJson('/api/order-requests', [
            'customer' => [
                'name' => 'Branch Buyer',
                'email' => 'branch@example.com',
                'contact_number' => '09175555555',
            ],
            'items' => [['part_number' => $product->part_number, 'quantity' => 1]],
            'payment_method' => 'pay_at_pickup',
            'fulfillment' => ['method' => 'pickup', 'branch_id' => $branch->id],
        ]);

        $response->assertUnprocessable();
        $this->assertDatabaseCount('order_requests', 0);
    }

    public function test_delivery_requires_delivery_details_and_rejects_pickup_delivery_mixing(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('HON-008', 1750.00);
        $basePayload = [
            'customer' => [
                'name' => 'Contract Buyer',
                'email' => 'contract@example.com',
                'contact_number' => '09176666666',
            ],
            'items' => [['part_number' => $product->part_number, 'quantity' => 1]],
            'payment_method' => 'online_payment',
            'fulfillment' => ['method' => 'delivery', 'branch_id' => $branch->id],
        ];

        $this->postJson('/api/order-requests', $basePayload)->assertUnprocessable();

        $this->postJson('/api/order-requests', [
            ...$basePayload,
            'payment_method' => 'pay_at_pickup',
            'fulfillment' => [
                'method' => 'pickup',
                'branch_id' => $branch->id,
                'delivery' => [
                    'address' => 'Unexpected address',
                    'barangay' => 'Test',
                    'city' => 'Test City',
                    'contact_person' => 'Test',
                ],
            ],
        ])->assertUnprocessable();

        $this->postJson('/api/order-requests', [
            ...$basePayload,
            'payment_method' => 'pay_at_pickup',
            'fulfillment' => [
                'method' => 'delivery',
                'branch_id' => $branch->id,
                'delivery' => [
                    'address' => '12 Main Street',
                    'barangay' => 'San Isidro',
                    'city' => 'Makati City',
                    'contact_person' => 'Contract Buyer',
                ],
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors('payment_method');

        $this->assertDatabaseCount('order_requests', 0);
    }

    public function test_payment_method_is_required(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('HON-009', 900.00);

        $this->postJson('/api/order-requests', [
            'customer' => [
                'name' => 'Missing Payment Buyer',
                'email' => 'missing-payment@example.com',
                'contact_number' => '09178888888',
            ],
            'items' => [['part_number' => $product->part_number, 'quantity' => 1]],
            'fulfillment' => [
                'method' => 'pickup',
                'branch_id' => $branch->id,
            ],
        ])->assertUnprocessable()->assertJsonValidationErrors('payment_method');

        $this->assertDatabaseCount('order_requests', 0);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_invalid_bearer_tokens_are_not_treated_as_guests(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('INVALID-TOKEN-001', 100.00);

        $this->withToken('invalid-token')->postJson('/api/order-requests', [
            'customer' => [
                'name' => 'Invalid Token Buyer',
                'email' => 'invalid-token@example.com',
                'contact_number' => '09177777777',
            ],
            'items' => [['part_number' => $product->part_number, 'quantity' => 1]],
            'payment_method' => 'pay_at_pickup',
            'fulfillment' => ['method' => 'pickup', 'branch_id' => $branch->id],
        ])->assertUnauthorized();
    }

    public function test_admin_tokens_cannot_create_customer_orders(): void
    {
        $branch = $this->createBranch();
        $product = $this->createProduct('ADMIN-TOKEN-001', 100.00);
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin-order-test@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'admin',
        ]);
        $token = $admin->createToken('order-test')->plainTextToken;

        $this->withToken($token)->postJson('/api/order-requests', [
            'items' => [['part_number' => $product->part_number, 'quantity' => 1]],
            'payment_method' => 'pay_at_pickup',
            'fulfillment' => ['method' => 'pickup', 'branch_id' => $branch->id],
        ])->assertForbidden();
        $this->assertDatabaseCount('order_requests', 0);
    }

    private function createBranch(array $overrides = []): Branch
    {
        return Branch::create(array_merge([
            'name' => 'Test Branch '.uniqid(),
            'address' => 'Test Branch Address',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ], $overrides));
    }

    private function createProduct(string $partNumber, float $price, array $overrides = []): Product
    {
        $category = Category::firstOrCreate([
            'name' => 'Test Parts',
        ], [
            'description' => 'Test category',
            'status' => 'active',
        ]);

        return Product::create(array_merge([
            'category_id' => $category->id,
            'name' => 'Test Product '.$partNumber,
            'part_number' => $partNumber,
            'brand' => 'Test Brand',
            'description' => 'Test product description',
            'price' => $price,
            'img_url' => 'https://example.com/test-product.png',
            'availability_status' => 'active',
            'status' => 'active',
        ], $overrides));
    }
}
