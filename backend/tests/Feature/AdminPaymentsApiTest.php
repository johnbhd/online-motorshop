<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminPaymentsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_admin_can_oversee_real_payments_across_branches(): void
    {
        $admin = $this->createUser('admin');
        $manila = $this->createBranch('Manila');
        $makati = $this->createBranch('Makati');
        $firstOrder = $this->createOrder('Mark Reyes', $manila, 'ALD-2026-PAY-001', 'pickup');
        $secondOrder = $this->createOrder('Angela Cruz', $makati, 'ALD-2026-PAY-002', 'delivery');
        $firstPayment = $firstOrder->payments()->create([
            'payment_method' => Payment::METHOD_ONLINE_PAYMENT,
            'amount' => 250,
            'payment_reference' => 'PAY-001',
            'payment_status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
        ]);
        $secondOrder->payments()->create([
            'payment_method' => Payment::METHOD_PAY_AT_PICKUP,
            'amount' => 250,
            'payment_status' => Payment::STATUS_UNPAID,
        ]);

        $response = $this->requestAs($admin)
            ->getJson('/api/admin/payments?per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonPath('summary.waiting_for_verification', 1)
            ->assertJsonPath('summary.unpaid', 1)
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonCount(1, 'payments');

        $this->assertSame($secondOrder->order_reference, $response->json('payments.0.order_reference'));

        $this->requestAs($admin)
            ->getJson('/api/admin/payments?branch_id='.$manila->id.'&method='.Payment::METHOD_ONLINE_PAYMENT.'&search=Mark')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('payments.0.id', $firstPayment->id)
            ->assertJsonPath('payments.0.branch.id', $manila->id);

        $this->requestAs($admin)
            ->getJson('/api/admin/payments?fulfillment=delivery')
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('payments.0.order_reference', $secondOrder->order_reference);
    }

    public function test_admin_can_view_and_transition_payment_with_server_reviewer_metadata(): void
    {
        $admin = $this->createUser('admin');
        $branch = $this->createBranch('Admin Payment Branch');
        $order = $this->createOrder('Payment Customer', $branch, 'ALD-2026-PAY-003', 'pickup');
        $payment = $order->payments()->create([
            'payment_method' => Payment::METHOD_ONLINE_PAYMENT,
            'amount' => 250,
            'proof_image_url' => 'https://example.com/proof.png',
            'payment_status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
        ]);

        $this->requestAs($admin)
            ->getJson('/api/admin/payments/'.$payment->id)
            ->assertOk()
            ->assertJsonPath('payment.proof_image_url', 'https://example.com/proof.png')
            ->assertJsonPath('payment.allowed_statuses.0', Payment::STATUS_PAID)
            ->assertJsonPath('payment.allowed_statuses.1', Payment::STATUS_FAILED);

        $this->requestAs($admin)
            ->patchJson('/api/admin/payments/'.$payment->id.'/status', [
                'status' => Payment::STATUS_PAID,
                'verified_by' => 999999,
                'verified_at' => '2000-01-01T00:00:00Z',
            ])
            ->assertOk()
            ->assertJsonPath('payment.status', Payment::STATUS_PAID)
            ->assertJsonPath('payment.verified_by.id', $admin->id)
            ->assertJsonPath('payment.allowed_statuses', []);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'payment_status' => Payment::STATUS_PAID,
            'verified_by' => $admin->id,
        ]);
        $this->assertNotNull($payment->fresh()->verified_at);
    }

    public function test_non_admin_users_cannot_access_admin_payments(): void
    {
        $this->getJson('/api/admin/payments')->assertUnauthorized();

        $branch = $this->createBranch('Staff Payment Branch');
        $staff = $this->createUser('staff', $branch);

        $this->requestAs($staff)
            ->getJson('/api/admin/payments')
            ->assertForbidden();
    }

    private function requestAs(User $user)
    {
        return $this->withToken($user->createToken('admin-payments-test')->plainTextToken);
    }

    private function createUser(string $role, ?Branch $branch = null): User
    {
        return User::create([
            'name' => ucfirst($role).' User',
            'email' => $role.'-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch?->id,
            'status' => 'active',
            'role' => $role,
        ]);
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

    private function createOrder(string $customerName, Branch $branch, string $reference, string $fulfillment): OrderRequest
    {
        $customer = Customer::create([
            'full_name' => $customerName,
            'contact_number' => '09171111111',
            'email' => strtolower(str_replace(' ', '.', $customerName)).'@example.com',
        ]);

        return OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => $fulfillment,
            'order_status' => 'confirmed',
            'subtotal' => 250,
            'delivery_fee' => $fulfillment === 'delivery' ? 50 : 0,
            'total_amount' => $fulfillment === 'delivery' ? 300 : 250,
        ]);
    }
}
