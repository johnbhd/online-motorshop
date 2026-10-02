<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffPaymentsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_staff_payments_requires_authentication(): void
    {
        $this->getJson('/api/staff/payments')->assertUnauthorized();
        $this->getJson('/api/staff/payments/data')->assertUnauthorized();
        $this->patchJson('/api/staff/payments/1/status', [
            'status' => 'paid',
        ])->assertUnauthorized();
    }

    public function test_customer_cannot_access_staff_payments(): void
    {
        $customer = User::create([
            'name' => 'Customer User',
            'email' => 'staff-payments-customer@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $token = $customer->createToken('staff-payments-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/payments')
            ->assertForbidden();
    }

    public function test_staff_can_list_real_branch_scoped_payments(): void
    {
        $branch = $this->createBranch('Makati Staff Branch');
        $otherBranch = $this->createBranch('Other Staff Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Mark Reyes', '09171234567');
        $otherCustomer = $this->createCustomer('Other Customer', '09179999999');
        $product = $this->createProduct('PAYMENT-001', 250.00);

        $firstOrder = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000128',
            $branch,
            'confirmed',
        );
        $secondOrder = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000127',
            $branch,
            'confirmed',
        );
        $otherOrder = $this->createOrder(
            $otherCustomer,
            $product,
            'ALD-2026-000126',
            $otherBranch,
            'confirmed',
        );

        Payment::create([
            'order_id' => $firstOrder->id,
            'payment_method' => 'Online Payment',
            'amount' => 250.00,
            'payment_reference' => 'PAY-128',
            'payment_status' => 'waiting_for_verification',
        ]);
        Payment::create([
            'order_id' => $secondOrder->id,
            'payment_method' => 'Online Payment',
            'amount' => 250.00,
            'payment_reference' => 'PAY-127',
            'payment_status' => 'paid',
        ]);
        Payment::create([
            'order_id' => $otherOrder->id,
            'payment_method' => 'Online Payment',
            'amount' => 250.00,
            'payment_reference' => 'PAY-126',
            'payment_status' => 'paid',
        ]);

        $token = $staff->createToken('staff-payments-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/payments?search=PAY-128&status=waiting_for_verification&per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonPath('summary.paid', 1)
            ->assertJsonPath('summary.waiting_for_verification', 1)
            ->assertJsonCount(1, 'payments')
            ->assertJsonPath('payments.0.order_reference', 'ALD-2026-000128')
            ->assertJsonPath('payments.0.customer.full_name', 'Mark Reyes')
            ->assertJsonPath('payments.0.amount', 250)
            ->assertJsonPath('meta.total', 1);

        $this->withToken($token)
            ->getJson('/api/staff/payments?per_page=1')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(1, 'payments');
    }

    public function test_staff_payment_details_use_persisted_order_snapshots(): void
    {
        $branch = $this->createBranch('Detail Staff Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Detail Customer', '09171111111');
        $product = $this->createProduct('PAYMENT-002', 180.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000125',
            $branch,
            'confirmed',
        );
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'Online Payment',
            'amount' => 180.00,
            'payment_reference' => 'PAY-125',
            'proof_image_url' => 'https://example.com/payment-proof.png',
            'payment_status' => 'waiting_for_verification',
        ]);
        $product->update(['price' => 220.00]);
        $token = $staff->createToken('staff-payments-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/payments/'.$payment->id)
            ->assertOk()
            ->assertJsonPath('payment.order.reference', $order->order_reference)
            ->assertJsonPath('payment.customer.full_name', 'Detail Customer')
            ->assertJsonPath('payment.amount', 180)
            ->assertJsonPath('payment.proof_image_url', 'https://example.com/payment-proof.png')
            ->assertJsonPath('payment.order.items.0.unit_price', 180)
            ->assertJsonPath('payment.allowed_statuses.0', 'paid')
            ->assertJsonPath('payment.allowed_statuses.1', 'failed');
    }

    public function test_staff_can_verify_payment_with_server_metadata_only(): void
    {
        $branch = $this->createBranch('Verification Staff Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Verification Customer', '09172222222');
        $product = $this->createProduct('PAYMENT-003', 200.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000124',
            $branch,
            'confirmed',
        );
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'Online Payment',
            'amount' => 200.00,
            'payment_status' => 'waiting_for_verification',
        ]);
        $token = $staff->createToken('staff-payments-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/staff/payments/'.$payment->id.'/status', [
                'status' => 'paid',
                'verified_by' => 999999,
                'verified_at' => '2000-01-01T00:00:00Z',
            ])
            ->assertOk()
            ->assertJsonPath('payment.status', 'paid')
            ->assertJsonPath('payment.verified_by.id', $staff->id)
            ->assertJsonPath('payment.allowed_statuses', []);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'payment_status' => 'paid',
            'verified_by' => $staff->id,
        ]);
        $this->assertNotNull($payment->fresh()->verified_at);
        $this->assertDatabaseHas('order_requests', [
            'id' => $order->id,
            'order_status' => 'confirmed',
        ]);
    }

    public function test_invalid_status_and_invalid_transition_are_rejected(): void
    {
        $branch = $this->createBranch('Invalid Payment Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Invalid Payment Customer', '09173333333');
        $product = $this->createProduct('PAYMENT-004', 210.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000123',
            $branch,
            'confirmed',
        );
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'Online Payment',
            'amount' => 210.00,
            'payment_status' => 'paid',
        ]);
        $token = $staff->createToken('staff-payments-test')->plainTextToken;

        $this->withToken($token)
            ->patchJson('/api/staff/payments/'.$payment->id.'/status', [
                'status' => 'not-a-status',
            ])
            ->assertUnprocessable();

        $this->withToken($token)
            ->patchJson('/api/staff/payments/'.$payment->id.'/status', [
                'status' => 'waiting_for_verification',
            ])
            ->assertUnprocessable();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'payment_status' => 'paid',
        ]);
    }

    public function test_staff_cannot_view_or_update_payment_from_another_branch(): void
    {
        $branch = $this->createBranch('Scoped Payment Branch');
        $otherBranch = $this->createBranch('Hidden Payment Branch');
        $staff = $this->createStaff($branch);
        $customer = $this->createCustomer('Hidden Customer', '09174444444');
        $product = $this->createProduct('PAYMENT-005', 220.00);
        $order = $this->createOrder(
            $customer,
            $product,
            'ALD-2026-000122',
            $otherBranch,
            'confirmed',
        );
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => 'Online Payment',
            'amount' => 220.00,
            'payment_status' => 'waiting_for_verification',
        ]);
        $token = $staff->createToken('staff-payments-test')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/staff/payments/'.$payment->id)
            ->assertNotFound();

        $this->withToken($token)
            ->patchJson('/api/staff/payments/'.$payment->id.'/status', [
                'status' => 'paid',
            ])
            ->assertNotFound();

        $this->withToken($token)
            ->getJson('/api/staff/payments?search=Hidden')
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
        string $status,
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

        return $order;
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
