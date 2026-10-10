<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\StaffAdminNotification;
use App\Services\ConversationService;
use App\Services\StaffAdminNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StaffAdminNotificationsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_staff_feed_is_branch_scoped_and_admin_feed_covers_all_branches(): void
    {
        $branch = Branch::create(['name' => 'North', 'address' => 'North address', 'contact_number' => '09170000001']);
        $otherBranch = Branch::create(['name' => 'South', 'address' => 'South address', 'contact_number' => '09170000002']);
        $staff = $this->user('branch-staff', 'staff', $branch->id);
        $otherStaff = $this->user('other-staff', 'staff', $otherBranch->id);
        $admin = $this->user('portal-admin', 'admin');
        $order = $this->order($branch->id);

        app(StaffAdminNotificationService::class)->orderCreated($order);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/staff/notifications?category=orders')
            ->assertOk()
            ->assertJsonCount(1, 'notifications')
            ->assertJsonPath('notifications.0.reference.order_id', $order->id)
            ->assertJsonPath('unread_count', 1);

        $this->actingAs($otherStaff, 'sanctum')
            ->getJson('/api/staff/notifications')
            ->assertOk()
            ->assertJsonCount(0, 'notifications');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'notifications');
    }

    public function test_assignment_notifies_only_the_newly_assigned_staff(): void
    {
        $branch = Branch::create(['name' => 'Central', 'address' => 'Central address', 'contact_number' => '09170000003']);
        $staff = $this->user('assigned-staff', 'staff', $branch->id);
        $otherStaff = $this->user('unassigned-staff', 'staff', $branch->id);
        $order = $this->order($branch->id);

        app(StaffAdminNotificationService::class)->orderAssigned($order, $staff->id);

        $this->assertSame(1, $staff->notifications()->where('type', StaffAdminNotification::class)->count());
        $this->assertSame(0, $otherStaff->notifications()->count());
    }

    public function test_payment_proof_and_customer_message_create_persistent_notifications(): void
    {
        $branch = Branch::create(['name' => 'East', 'address' => 'East address', 'contact_number' => '09170000004']);
        $staff = $this->user('payment-staff', 'staff', $branch->id);
        $admin = $this->user('payment-admin', 'admin');
        $order = $this->order($branch->id);
        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => Payment::METHOD_ONLINE_PAYMENT,
            'amount' => 100,
            'payment_status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
        ]);

        $service = app(StaffAdminNotificationService::class);
        $service->paymentProofSubmitted($payment);

        $conversation = Conversation::create([
            'customer_id' => $order->customer_id,
            'participant_type' => 'customer',
            'status' => 'open',
        ]);
        app(ConversationService::class)->appendCustomerMessage($conversation, $order->customer->user, 'Can you help?');

        $this->assertSame(2, $staff->fresh()->notifications()->where('type', StaffAdminNotification::class)->count());
        $this->assertSame(2, $admin->fresh()->notifications()->where('type', StaffAdminNotification::class)->count());
        $this->assertSame(1, $staff->notifications()->where('data', 'like', '%payment_proof_submitted%')->count());
        $this->assertSame(1, $staff->notifications()->where('data', 'like', '%customer_message_received%')->count());
    }

    public function test_read_operations_are_owned_and_mark_all_is_persistent(): void
    {
        $staff = $this->user('read-owner', 'staff');
        $otherStaff = $this->user('read-other', 'staff');
        $staff->notify(new StaffAdminNotification([
            'notification_type' => 'order_request_created',
            'category' => 'orders',
            'title' => 'Order',
            'message' => 'Order update',
            'reference' => ['type' => 'order', 'order_id' => 1],
            'event_key' => 'test:read',
        ]));
        $id = (string) $staff->notifications()->first()->id;

        $this->actingAs($otherStaff, 'sanctum')
            ->patchJson('/api/staff/notifications/'.$id.'/read')
            ->assertNotFound();

        $this->actingAs($staff, 'sanctum')
            ->patchJson('/api/staff/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('updated', 1)
            ->assertJsonPath('unread_count', 0);
    }

    private function user(string $prefix, string $role, ?int $branchId = null): User
    {
        return User::create([
            'name' => $prefix,
            'email' => $prefix.'-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => $role,
            'branch_id' => $branchId,
        ]);
    }

    private function order(int $branchId): OrderRequest
    {
        $customerUser = $this->user('customer', 'customer');
        $customer = Customer::create([
            'user_id' => $customerUser->id,
            'full_name' => $customerUser->name,
            'contact_number' => '09170000005',
            'email' => $customerUser->email,
        ]);

        return OrderRequest::create([
            'order_reference' => 'ALD-'.strtoupper(uniqid()),
            'customer_id' => $customer->id,
            'branch_id' => $branchId,
            'fulfillment_type' => 'pickup',
            'order_status' => 'pending',
            'subtotal' => 100,
            'delivery_fee' => 0,
            'total_amount' => 100,
        ]);
    }
}
