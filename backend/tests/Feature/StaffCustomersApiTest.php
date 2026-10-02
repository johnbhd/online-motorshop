<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffCustomersApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_staff_customers_requires_authentication_and_staff_role(): void
    {
        $this->getJson('/api/staff/customers')->assertUnauthorized();

        $customer = User::create([
            'name' => 'Customer User',
            'email' => 'staff-customers-customer@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $token = $customer->createToken('staff-customers-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/customers')
            ->assertForbidden();
    }

    public function test_staff_customer_list_is_branch_scoped_and_supports_search_type_and_pagination(): void
    {
        $branch = $this->createBranch('Makati Staff Branch');
        $otherBranch = $this->createBranch('Other Staff Branch');
        $product = $this->createProduct('CUSTOMER-001', 180.00);
        $staff = $this->createStaff($branch);
        [$registeredUser, $registered] = $this->createRegisteredCustomer(
            'Registered Customer',
            'registered@example.com',
            '09171111111',
        );
        $guest = $this->createGuestCustomer('Guest Customer', '09172222222');
        $hidden = $this->createGuestCustomer('Hidden Customer', '09173333333');

        $this->createOrder($registered, $product, 'ALD-2026-044001', $branch, 'pending');
        $this->createOrder($registered, $product, 'ALD-2026-044002', $otherBranch, 'completed');
        $this->createOrder($guest, $product, 'ALD-2026-044003', $branch, 'completed');
        $this->createOrder($hidden, $product, 'ALD-2026-044004', $otherBranch, 'pending');

        $token = $staff->createToken('staff-customers-test')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/staff/customers')
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonPath('summary.registered', 1)
            ->assertJsonPath('summary.guest', 1)
            ->assertJsonPath('summary.active_orders', 1)
            ->assertJsonPath('meta.total', 2);

        $registeredCustomer = collect($response->json('customers'))
            ->firstWhere('id', $registered->id);

        $this->assertSame('Registered Customer', $registeredCustomer['name']);
        $this->assertSame('registered', $registeredCustomer['type']);
        $this->assertSame($registeredUser->email, $registeredCustomer['email']);
        $this->assertSame(1, $registeredCustomer['orders']);
        $this->assertSame(1, $registeredCustomer['active_orders']);
        $this->assertArrayNotHasKey('password', $registeredCustomer);

        $this->withToken($token)
            ->getJson('/api/staff/customers?per_page=1')
            ->assertOk()
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.total', 2);

        $this->withToken($token)
            ->getJson('/api/staff/customers?search=09172222222&type=guest')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('customers.0.name', 'Guest Customer')
            ->assertJsonPath('customers.0.type', 'guest');

        $this->withToken($token)
            ->getJson('/api/staff/customers?search=hidden')
            ->assertOk()
            ->assertJsonPath('meta.total', 0)
            ->assertJsonCount(0, 'customers');
    }

    public function test_staff_customer_details_use_authorized_historical_orders_only(): void
    {
        $branch = $this->createBranch('Details Staff Branch');
        $otherBranch = $this->createBranch('Hidden Details Branch');
        $product = $this->createProduct('CUSTOMER-002', 180.00);
        $staff = $this->createStaff($branch);
        [, $customer] = $this->createRegisteredCustomer(
            'Detail Customer',
            'detail@example.com',
            '09174444444',
        );

        $activeOrder = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-044005',
            $branch,
            'under_review',
        );
        $completedOrder = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-044006',
            $branch,
            'completed',
        );
        $hiddenOrder = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-044007',
            $otherBranch,
            'completed',
        );
        $product->update(['price' => 240.00]);

        $token = $staff->createToken('staff-customers-test')->plainTextToken;
        $conversationsBefore = $this->app['db']->table('conversations')->count();

        $this->withToken($token)
            ->getJson('/api/staff/customers/'.$customer->id)
            ->assertOk()
            ->assertJsonPath('customer.name', 'Detail Customer')
            ->assertJsonPath('customer.type', 'registered')
            ->assertJsonPath('customer.email', 'detail@example.com')
            ->assertJsonPath('summary.orders', 2)
            ->assertJsonPath('summary.active_orders', 1)
            ->assertJsonPath('summary.completed_orders', 1)
            ->assertJsonPath('summary.last_order.reference', $completedOrder->order_reference)
            ->assertJsonCount(1, 'active_orders')
            ->assertJsonPath('active_orders.0.reference', $activeOrder->order_reference)
            ->assertJsonCount(2, 'recent_orders')
            ->assertJsonPath('recent_orders.0.total_amount', 180)
            ->assertJsonMissing(['reference' => $hiddenOrder->order_reference])
            ->assertJsonMissingPath('customer.password')
            ->assertJsonMissingPath('customer.remember_token')
            ->assertJsonMissingPath('customer.tokens');

        $this->assertSame(
            $conversationsBefore,
            $this->app['db']->table('conversations')->count(),
        );

        $hiddenCustomer = $this->createGuestCustomer(
            'Unrelated Customer',
            '09176666666',
        );
        $this->createOrder(
            $hiddenCustomer,
            $product,
            'ALD-2026-044010',
            $otherBranch,
            'completed',
        );

        $this->withToken($token)
            ->getJson('/api/staff/customers/'.$hiddenCustomer->id)
            ->assertNotFound();
    }

    public function test_separate_guest_records_with_same_contact_remain_distinct(): void
    {
        $branch = $this->createBranch('Guest Records Branch');
        $product = $this->createProduct('CUSTOMER-003', 120.00);
        $staff = $this->createStaff($branch);
        $firstGuest = $this->createGuestCustomer('First Guest', '09175555555');
        $secondGuest = $this->createGuestCustomer('Second Guest', '09175555555');

        $this->createOrder($firstGuest, $product, 'ALD-2026-044008', $branch);
        $this->createOrder($secondGuest, $product, 'ALD-2026-044009', $branch);

        $token = $staff->createToken('staff-customers-test')->plainTextToken;

        $response = $this->withToken($token)
            ->getJson('/api/staff/customers?search=09175555555')
            ->assertOk();

        $this->assertSame(2, $response->json('meta.total'));
        $this->assertCount(2, $response->json('customers'));
        $this->assertNotSame(
            $response->json('customers.0.id'),
            $response->json('customers.1.id'),
        );
    }

    private function createBranch(string $name): Branch
    {
        return Branch::create([
            'name' => $name,
            'address' => $name.' Address',
            'contact_number' => '09170000000',
            'pickup_available' => true,
            'status' => 'active',
        ]);
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

    /**
     * @return array{0: User, 1: Customer}
     */
    private function createRegisteredCustomer(
        string $name,
        string $email,
        string $contact,
    ): array {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $customer = Customer::create([
            'user_id' => $user->id,
            'full_name' => $name,
            'contact_number' => $contact,
            'email' => $email,
            'address' => 'Customer Address',
        ]);

        return [$user, $customer];
    }

    private function createGuestCustomer(string $name, string $contact): Customer
    {
        return Customer::create([
            'user_id' => null,
            'full_name' => $name,
            'contact_number' => $contact,
            'email' => strtolower(str_replace(' ', '.', $name)).'@example.com',
            'address' => null,
        ]);
    }

    private function createProduct(string $partNumber, float $price): Product
    {
        $category = Category::firstOrCreate([
            'name' => 'Customer Test Parts',
        ], [
            'description' => 'Customer test category',
            'status' => 'active',
        ]);

        return Product::create([
            'name' => 'Customer Test Product',
            'part_number' => $partNumber,
            'brand' => 'Universal',
            'category_id' => $category->id,
            'description' => 'Customer test product',
            'price' => $price,
            'img_url' => 'https://example.com/customer-test-product.png',
            'availability_status' => 'active',
            'status' => 'active',
        ]);
    }

    private function createOrder(
        Customer $customer,
        Product $product,
        string $reference,
        Branch $branch,
        string $status = 'pending',
    ): OrderRequest {
        $amount = (float) $product->price;
        $order = OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => 'pickup',
            'order_status' => $status,
            'subtotal' => $amount,
            'delivery_fee' => 0,
            'total_amount' => $amount,
        ]);
        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'unit_price' => $amount,
            'quantity' => 1,
            'subtotal' => $amount,
        ]);

        $order->pickupRequest()->create([
            'branch_id' => $branch->id,
            'pickup_status' => 'pending',
        ]);

        return $order;
    }
}
