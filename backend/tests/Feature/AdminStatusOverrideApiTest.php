<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminStatusOverrideApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_admin_can_roll_back_an_order_and_audit_the_correction(): void
    {
        $admin = $this->createUser('admin');
        $order = $this->createOrder('ALD-2026-OVERRIDE-ORDER', 'confirmed');

        $this->requestAs($admin)
            ->patchJson('/api/admin/orders/'.$order->order_reference.'/status', [
                'status' => 'under_review',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reason');

        $this->requestAs($admin)
            ->patchJson('/api/admin/orders/'.$order->order_reference.'/status', [
                'status' => 'under_review',
                'reason' => 'The order was confirmed before the review was completed.',
            ])
            ->assertOk()
            ->assertJsonPath('order.status', 'under_review')
            ->assertJsonPath('order.status_overrides.0.previous_status', 'confirmed')
            ->assertJsonPath('order.status_overrides.0.new_status', 'under_review');

        $this->assertDatabaseHas('admin_audit_logs', [
            'actor_user_id' => $admin->id,
            'record_type' => 'order',
            'record_id' => $order->id,
            'previous_status' => 'confirmed',
            'new_status' => 'under_review',
            'reason' => 'The order was confirmed before the review was completed.',
        ]);
    }

    public function test_admin_can_reopen_completed_pickup_and_clear_completion_timestamp(): void
    {
        $admin = $this->createUser('admin');
        $order = $this->createOrder('ALD-2026-OVERRIDE-PICKUP', 'confirmed', 'pickup');
        $pickup = PickupRequest::create([
            'order_id' => $order->id,
            'branch_id' => $order->branch_id,
            'pickup_status' => 'completed',
            'completed_at' => now(),
        ]);

        $this->requestAs($admin)
            ->patchJson('/api/admin/pickup-requests/'.$pickup->id.'/status', [
                'status' => 'ready_for_pickup',
                'reason' => 'The pickup was completed by mistake.',
            ])
            ->assertOk()
            ->assertJsonPath('pickup_request.pickup_status', 'ready_for_pickup');

        $this->assertDatabaseHas('pickup_requests', [
            'id' => $pickup->id,
            'pickup_status' => 'ready_for_pickup',
            'completed_at' => null,
        ]);
        $this->assertDatabaseHas('admin_audit_logs', [
            'record_type' => 'pickup',
            'record_id' => $pickup->id,
            'previous_status' => 'completed',
            'new_status' => 'ready_for_pickup',
        ]);
    }

    public function test_admin_can_roll_back_delivery_without_erasing_booking_evidence(): void
    {
        $admin = $this->createUser('admin');
        $order = $this->createOrder('ALD-2026-OVERRIDE-DELIVERY', 'confirmed', 'delivery');
        $payment = $order->payments()->create([
            'payment_method' => Payment::METHOD_ONLINE_PAYMENT,
            'amount' => 250,
            'payment_status' => Payment::STATUS_PAID,
            'verified_at' => now(),
        ]);
        $delivery = DeliveryRequest::create([
            'order_id' => $order->id,
            'branch_id' => $order->branch_id,
            'delivery_address' => '123 ALD Street',
            'booking_reference' => 'LAL-OVERRIDE-001',
            'rider_name' => 'Rider One',
            'delivery_status' => 'delivered',
            'delivered_at' => now(),
        ]);

        $this->requestAs($admin)
            ->patchJson('/api/admin/delivery-requests/'.$delivery->id.'/status', [
                'status' => 'in_transit',
                'reason' => 'The delivery was marked delivered before handoff was verified.',
            ])
            ->assertOk()
            ->assertJsonPath('delivery_request.delivery_status', 'in_transit');

        $this->assertDatabaseHas('delivery_requests', [
            'id' => $delivery->id,
            'delivery_status' => 'in_transit',
            'booking_reference' => 'LAL-OVERRIDE-001',
            'rider_name' => 'Rider One',
            'delivered_at' => null,
        ]);
        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'payment_status' => Payment::STATUS_PAID,
        ]);
        $this->assertDatabaseHas('admin_audit_logs', [
            'record_type' => 'delivery',
            'record_id' => $delivery->id,
            'previous_status' => 'delivered',
            'new_status' => 'in_transit',
        ]);
    }

    public function test_admin_payment_rollback_requires_reason_and_keeps_proof(): void
    {
        $admin = $this->createUser('admin');
        $order = $this->createOrder('ALD-2026-OVERRIDE-PAYMENT', 'confirmed');
        $payment = $order->payments()->create([
            'payment_method' => Payment::METHOD_ONLINE_PAYMENT,
            'amount' => 250,
            'proof_image_url' => 'https://example.test/proof.png',
            'payment_status' => Payment::STATUS_PAID,
            'verified_by' => $admin->id,
            'verified_at' => now(),
        ]);

        $this->requestAs($admin)
            ->patchJson('/api/admin/payments/'.$payment->id.'/status', [
                'status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reason');

        $this->requestAs($admin)
            ->patchJson('/api/admin/payments/'.$payment->id.'/status', [
                'status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
                'reason' => 'The payment was verified against the wrong order.',
            ])
            ->assertOk()
            ->assertJsonPath('payment.status', Payment::STATUS_WAITING_FOR_VERIFICATION);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'payment_status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
            'proof_image_url' => 'https://example.test/proof.png',
        ]);
        $this->assertDatabaseHas('admin_audit_logs', [
            'record_type' => 'payment',
            'record_id' => $payment->id,
            'previous_status' => Payment::STATUS_PAID,
            'new_status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
        ]);
    }

    public function test_staff_cannot_use_admin_status_override_routes(): void
    {
        $branch = $this->createBranch('Override Access Branch');
        $staff = $this->createUser('staff', $branch);
        $order = $this->createOrder('ALD-2026-OVERRIDE-ACCESS', 'confirmed', 'pickup', $branch);
        $pickup = PickupRequest::create([
            'order_id' => $order->id,
            'branch_id' => $branch->id,
            'pickup_status' => 'completed',
        ]);

        $this->requestAs($staff)
            ->patchJson('/api/admin/pickup-requests/'.$pickup->id.'/status', [
                'status' => 'ready_for_pickup',
                'reason' => 'Unauthorized correction.',
            ])
            ->assertForbidden();
    }

    private function requestAs(User $user)
    {
        return $this->withToken($user->createToken('admin-status-override-test')->plainTextToken);
    }

    private function createUser(string $role, ?Branch $branch = null): User
    {
        return User::create([
            'name' => ucfirst($role).' Override User',
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

    private function createOrder(
        string $reference,
        string $status,
        string $fulfillment = 'pickup',
        ?Branch $branch = null,
    ): OrderRequest {
        $branch ??= $this->createBranch('Override Branch '.uniqid());
        $customer = Customer::create([
            'full_name' => 'Override Customer',
            'contact_number' => '09171111111',
            'email' => 'override-'.uniqid().'@example.com',
        ]);

        return OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'fulfillment_type' => $fulfillment,
            'order_status' => $status,
            'subtotal' => 250,
            'delivery_fee' => $fulfillment === 'delivery' ? 50 : 0,
            'total_amount' => $fulfillment === 'delivery' ? 300 : 250,
        ]);
    }
}
