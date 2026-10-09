<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\User;
use App\Notifications\CustomerNotification;
use App\Services\ConversationService;
use App\Services\StaffOrderStatusService;
use App\Services\StaffPaymentStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CustomerNotificationsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_customer_can_list_and_read_only_owned_notifications(): void
    {
        $customer = $this->customer('notifications-owner');
        $otherCustomer = $this->customer('notifications-other');

        $customer->notify($this->notification('orders', 'Order Confirmed', 'order_confirmed'));
        $otherCustomer->notify($this->notification('orders', 'Private Order', 'order_confirmed'));

        $response = $this->actingAs($customer, 'sanctum')
            ->getJson('/api/customer/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'notifications')
            ->assertJsonPath('unread_count', 1)
            ->assertJsonPath('notifications.0.title', 'Order Confirmed');

        $notificationId = $response->json('notifications.0.id');

        $this->actingAs($customer, 'sanctum')
            ->patchJson('/api/customer/notifications/'.$notificationId.'/read')
            ->assertOk()
            ->assertJsonPath('notification.read', true)
            ->assertJsonPath('unread_count', 0);

        $otherNotificationId = (string) $otherCustomer->notifications()->first()->id;
        $this->actingAs($customer, 'sanctum')
            ->patchJson('/api/customer/notifications/'.$otherNotificationId.'/read')
            ->assertNotFound();
    }

    public function test_mark_all_read_persists_and_category_filter_is_server_side(): void
    {
        $customer = $this->customer('notifications-filter');
        $customer->notify($this->notification('orders', 'Order Update', 'order_confirmed'));
        $customer->notify($this->notification('support', 'Support Reply', 'support_message_received'));

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/customer/notifications?category=support')
            ->assertOk()
            ->assertJsonCount(1, 'notifications')
            ->assertJsonPath('notifications.0.category', 'support');

        $this->actingAs($customer, 'sanctum')
            ->patchJson('/api/customer/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('updated', 2)
            ->assertJsonPath('unread_count', 0);

        $this->assertSame(2, $customer->notifications()->whereNotNull('read_at')->count());
    }

    public function test_order_and_payment_transitions_create_customer_notifications_after_success(): void
    {
        $customer = $this->customer('notifications-status');
        $order = OrderRequest::create([
            'order_reference' => 'ALD-'.strtoupper(uniqid()),
            'customer_id' => $customer->customer->id,
            'fulfillment_type' => 'pickup',
            'order_status' => 'pending',
            'subtotal' => 100,
            'delivery_fee' => 0,
            'total_amount' => 100,
        ]);

        $service = app(StaffOrderStatusService::class);
        $service->transition($order, 'under_review');
        $service->transition($order->fresh(), 'confirmed');

        $payment = Payment::create([
            'order_id' => $order->id,
            'payment_method' => Payment::METHOD_ONLINE_PAYMENT,
            'amount' => 100,
            'payment_status' => Payment::STATUS_WAITING_FOR_VERIFICATION,
        ]);
        $reviewer = User::create([
            'name' => 'Notification Reviewer',
            'email' => 'notification-reviewer-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'staff',
        ]);

        app(StaffPaymentStatusService::class)->transition($payment, Payment::STATUS_PAID, $reviewer);

        $this->assertSame(2, $customer->notifications()->count());
        $this->assertDatabaseHas('notifications', ['notifiable_id' => $customer->id, 'type' => CustomerNotification::class]);
        $this->assertSame(1, $customer->notifications()->where('data', 'like', '%payment_verified%')->count());
    }

    public function test_staff_support_reply_notifies_registered_customer_but_customer_message_does_not(): void
    {
        $customer = $this->customer('notifications-support');
        $conversation = Conversation::create([
            'customer_id' => $customer->customer->id,
            'participant_type' => 'customer',
            'status' => 'open',
        ]);
        $staff = User::create([
            'name' => 'Support Staff',
            'email' => 'support-staff-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'staff',
        ]);

        app(ConversationService::class)->appendCustomerMessage($conversation, $customer, 'I need help.');
        $this->assertCount(0, $customer->notifications);

        app(ConversationService::class)->appendStaffMessage($conversation, $staff, 'We can help with that.');

        $this->assertCount(1, $customer->fresh()->notifications);
        $this->assertSame('support_message_received', $customer->fresh()->notifications()->first()->data['notification_type']);
    }

    private function customer(string $prefix): User
    {
        $user = User::create([
            'name' => $prefix,
            'email' => $prefix.'-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);

        Customer::create([
            'user_id' => $user->id,
            'full_name' => $prefix,
            'contact_number' => '09170000000',
            'email' => $user->email,
        ]);

        return $user->fresh('customer');
    }

    private function notification(string $category, string $title, string $type): CustomerNotification
    {
        return new CustomerNotification([
            'notification_type' => $type,
            'category' => $category,
            'title' => $title,
            'message' => $title,
            'reference' => ['type' => 'order', 'order_reference' => 'ALD-TEST'],
            'event_key' => uniqid('test-', true),
        ]);
    }
}
