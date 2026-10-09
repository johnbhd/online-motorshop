<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminReportsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_reports_require_admin_access_and_validate_date_range(): void
    {
        $this->getJson('/api/admin/reports/data')->assertUnauthorized();

        $staff = $this->createUser('staff');
        $this->requestAs($staff)->getJson('/api/admin/reports/data')->assertForbidden();

        $admin = $this->createUser('admin');
        $this->requestAs($admin)
            ->getJson('/api/admin/reports/data?from=2026-10-31&to=2026-10-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to']);
    }

    public function test_admin_reports_aggregate_real_domain_data_and_filters_by_branch_and_date(): void
    {
        $admin = $this->createUser('admin');
        $manila = $this->createBranch('Manila Branch');
        $makati = $this->createBranch('Makati Branch');
        $registered = $this->createCustomer('Registered Customer', $this->createUser('customer'));
        $guest = $this->createCustomer('Guest Customer');
        $otherGuest = $this->createCustomer('Other Guest');
        $firstProduct = $this->createProduct('REPORT-001', 'Report Brake Pad', 150);
        $secondProduct = $this->createProduct('REPORT-002', 'Report Chain Kit', 300);

        $pickupSuccess = $this->createOrder($registered, $firstProduct, 'ALD-REPORT-001', $manila, 'completed', 'pickup', 300, '2026-10-05 10:00:00');
        $pickupSuccess->items()->delete();
        $pickupSuccess->items()->create([
            'product_id' => $firstProduct->id,
            'product_name' => $firstProduct->name,
            'unit_price' => 150,
            'quantity' => 2,
            'subtotal' => 300,
        ]);
        $pickupSuccess->payments()->create([
            'payment_method' => Payment::METHOD_PAY_AT_PICKUP,
            'amount' => 300,
            'payment_status' => Payment::STATUS_PAID,
        ]);
        $pickupSuccess->pickupRequest()->create([
            'branch_id' => $manila->id,
            'pickup_status' => 'completed',
        ]);

        $deliverySuccess = $this->createOrder($guest, $secondProduct, 'ALD-REPORT-002', $makati, 'completed', 'delivery', 450, '2026-10-06 11:00:00');
        $deliverySuccess->items()->delete();
        $deliverySuccess->items()->create([
            'product_id' => $firstProduct->id,
            'product_name' => $firstProduct->name,
            'unit_price' => 150,
            'quantity' => 1,
            'subtotal' => 150,
        ]);
        $deliverySuccess->items()->create([
            'product_id' => $secondProduct->id,
            'product_name' => $secondProduct->name,
            'unit_price' => 300,
            'quantity' => 1,
            'subtotal' => 300,
        ]);
        $deliverySuccess->payments()->create([
            'payment_method' => Payment::METHOD_ONLINE_PAYMENT,
            'amount' => 450,
            'payment_status' => Payment::STATUS_PAID,
        ]);
        $deliverySuccess->deliveryRequest()->create([
            'branch_id' => $makati->id,
            'delivery_address' => 'Makati delivery address',
            'delivery_status' => 'delivered',
        ]);

        $unpaidCompleted = $this->createOrder($otherGuest, $firstProduct, 'ALD-REPORT-003', $manila, 'completed', 'pickup', 200, '2026-10-07 12:00:00');
        $unpaidCompleted->payments()->create([
            'payment_method' => Payment::METHOD_PAY_AT_PICKUP,
            'amount' => 200,
            'payment_status' => Payment::STATUS_UNPAID,
        ]);
        $unpaidCompleted->pickupRequest()->create([
            'branch_id' => $manila->id,
            'pickup_status' => 'completed',
        ]);

        $pending = $this->createOrder($registered, $firstProduct, 'ALD-REPORT-004', $manila, 'pending', 'pickup', 100, '2026-10-08 13:00:00');
        $pending->payments()->create([
            'payment_method' => Payment::METHOD_ONLINE_PAYMENT,
            'amount' => 100,
            'payment_status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
        ]);
        $pending->pickupRequest()->create([
            'branch_id' => $manila->id,
            'pickup_status' => 'pending',
        ]);

        $outsideRange = $this->createOrder($registered, $firstProduct, 'ALD-REPORT-005', $manila, 'completed', 'pickup', 999, '2026-09-01 09:00:00');
        $outsideRange->payments()->create([
            'payment_method' => Payment::METHOD_PAY_AT_PICKUP,
            'amount' => 999,
            'payment_status' => Payment::STATUS_PAID,
        ]);
        $outsideRange->pickupRequest()->create([
            'branch_id' => $manila->id,
            'pickup_status' => 'completed',
        ]);

        Review::create([
            'product_id' => $firstProduct->id,
            'customer_id' => $registered->id,
            'order_id' => $pickupSuccess->id,
            'order_item_id' => $pickupSuccess->items()->first()->id,
            'rating' => 5,
            'review_text' => 'Great fit.',
            'status' => Review::STATUS_PUBLISHED,
            'verified_purchase' => true,
        ]);
        Review::create([
            'product_id' => $secondProduct->id,
            'customer_id' => $guest->id,
            'order_id' => $deliverySuccess->id,
            'order_item_id' => $deliverySuccess->items()->where('product_id', $secondProduct->id)->first()->id,
            'rating' => 4,
            'review_text' => 'Good delivery.',
            'status' => Review::STATUS_PENDING,
            'verified_purchase' => true,
        ]);

        $response = $this->requestAs($admin)
            ->getJson('/api/admin/reports/data?from=2026-10-01&to=2026-10-31')
            ->assertOk();

        $response
            ->assertJsonPath('overview.total_orders', 4)
            ->assertJsonPath('overview.successful_orders', 2)
            ->assertJsonPath('overview.revenue_collected', 750)
            ->assertJsonPath('overview.paid_orders', 2)
            ->assertJsonPath('overview.average_order_value', 375)
            ->assertJsonPath('fulfillment.0.orders', 3)
            ->assertJsonPath('fulfillment.0.successful_orders', 1)
            ->assertJsonPath('fulfillment.1.orders', 1)
            ->assertJsonPath('fulfillment.1.successful_orders', 1)
            ->assertJsonPath('payments.methods.0.value', 2)
            ->assertJsonPath('payments.methods.1.value', 2)
            ->assertJsonPath('customers.total', 3)
            ->assertJsonPath('customers.registered', 1)
            ->assertJsonPath('customers.guests', 2)
            ->assertJsonPath('reviews.total', 2)
            ->assertJsonPath('reviews.average_rating', 5)
            ->assertJsonPath('top_products.0.part_number', 'REPORT-001')
            ->assertJsonPath('top_products.0.units_sold', 3)
            ->assertJsonPath('top_products.0.revenue', 450)
            ->assertJsonPath('branches.0.branch', 'Makati Branch')
            ->assertJsonPath('branches.0.successful_orders', 1)
            ->assertJsonPath('branches.1.branch', 'Manila Branch')
            ->assertJsonPath('branches.1.orders', 3);

        $this->requestAs($admin)
            ->getJson('/api/admin/reports/data?from=2026-10-01&to=2026-10-31&branch_id='.$makati->id)
            ->assertOk()
            ->assertJsonPath('overview.total_orders', 1)
            ->assertJsonPath('overview.revenue_collected', 450)
            ->assertJsonPath('branches.0.branch', 'Makati Branch')
            ->assertJsonCount(1, 'branches');
    }

    public function test_admin_reports_returns_zero_state_for_empty_period(): void
    {
        $admin = $this->createUser('admin');

        $this->requestAs($admin)
            ->getJson('/api/admin/reports/data?from=2030-01-01&to=2030-01-31')
            ->assertOk()
            ->assertJsonPath('overview.total_orders', 0)
            ->assertJsonPath('overview.successful_orders', 0)
            ->assertJsonPath('overview.revenue_collected', 0)
            ->assertJsonPath('overview.average_order_value', 0)
            ->assertJsonPath('customers.total', 0)
            ->assertJsonPath('reviews.total', 0)
            ->assertJsonCount(31, 'order_trend')
            ->assertJsonCount(0, 'top_products');
    }

    private function requestAs(User $user)
    {
        return $this->actingAs($user, 'sanctum');
    }

    private function createUser(string $role, ?Branch $branch = null): User
    {
        return User::create([
            'name' => ucfirst($role).' Reports User',
            'email' => $role.'-reports-'.uniqid().'@example.com',
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
            'contact_number' => '0917'.str_pad((string) random_int(1000000, 9999999), 7, '0'),
            'email' => strtolower(str_replace(' ', '-', $name)).'-'.uniqid().'@example.com',
        ]);
    }

    private function createProduct(string $partNumber, string $name, int $price): Product
    {
        $category = Category::create([
            'name' => 'Reports Category '.$partNumber,
            'status' => 'active',
        ]);

        return Product::create([
            'category_id' => $category->id,
            'part_number' => $partNumber,
            'name' => $name,
            'brand' => 'Reports Brand',
            'description' => 'Reports test product',
            'img_url' => 'https://example.com/reports-'.$partNumber.'.jpg',
            'price' => $price,
            'availability_status' => 'active',
            'status' => 'active',
        ]);
    }

    private function createOrder(Customer $customer, Product $product, string $reference, Branch $branch, string $status, string $fulfillment, int $total, string $createdAt): OrderRequest
    {
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
        $order->forceFill(['created_at' => $createdAt, 'updated_at' => $createdAt])->saveQuietly();
        $order->items()->create([
            'product_id' => $product->id,
            'product_name' => $product->name,
            'unit_price' => $total,
            'quantity' => 1,
            'subtotal' => $total,
        ]);

        return $order->fresh();
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
}
