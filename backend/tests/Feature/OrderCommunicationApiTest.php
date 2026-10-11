<?php

namespace Tests\Feature;

use App\Events\OrderStatusChanged;
use App\Models\Conversation;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\User;
use App\Services\OrderCommunicationService;
use App\Services\StaffOrderStatusService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OrderCommunicationApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_status_transitions_create_distinct_automated_messages_and_notifications(): void
    {
        $user = $this->customerUser('status-communication');
        $order = $this->orderFor($user->customer, 'ALD-COMM-001');

        app(StaffOrderStatusService::class)->transition($order, 'under_review');
        app(StaffOrderStatusService::class)->transition($order->fresh(), 'confirmed');

        $conversation = Conversation::query()->where('customer_id', $user->customer->id)->firstOrFail();

        $this->assertDatabaseCount('messages', 2);
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'sender_type' => 'system',
            'message_type' => 'order_update',
            'event_key' => 'order-update:order:'.$order->id.':confirmed',
        ]);
        $this->assertSame(2, $user->fresh()->unreadNotifications()->count());
        $this->assertSame('confirmed', $conversation->fresh()->messages()->latest('id')->first()?->metadata['status']);
    }

    public function test_saving_the_same_status_without_a_transition_does_not_create_communication(): void
    {
        $user = $this->customerUser('same-status');
        $order = $this->orderFor($user->customer, 'ALD-COMM-002');

        $order->save();

        $this->assertDatabaseCount('messages', 0);
        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_automated_event_processing_is_idempotent(): void
    {
        $user = $this->customerUser('idempotent');
        $order = $this->orderFor($user->customer, 'ALD-COMM-003', [
            'order_status' => 'confirmed',
        ]);
        $event = new OrderStatusChanged($order, 'order', $order->id, 'under_review', 'confirmed');

        app(OrderCommunicationService::class)->handle($event);
        app(OrderCommunicationService::class)->handle($event);

        $this->assertDatabaseCount('messages', 1);
        $this->assertSame(1, $user->fresh()->notifications()->count());
    }

    public function test_customer_can_mark_owned_automated_messages_read_but_cannot_mark_another_customers_thread(): void
    {
        $user = $this->customerUser('read-owner');
        $otherUser = $this->customerUser('read-other');
        $order = $this->orderFor($user->customer, 'ALD-COMM-004', [
            'order_status' => 'confirmed',
        ]);
        $event = new OrderStatusChanged($order, 'order', $order->id, 'under_review', 'confirmed');

        app(OrderCommunicationService::class)->handle($event);
        $conversation = Conversation::query()->where('customer_id', $user->customer->id)->firstOrFail();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/conversations/'.$conversation->id.'/read')
            ->assertOk()
            ->assertJsonPath('read.messages', 1)
            ->assertJsonPath('read.notifications', 1);

        $this->assertNotNull($conversation->fresh()->messages()->firstOrFail()->read_at);
        $this->assertSame(0, $user->fresh()->unreadNotifications()->count());

        $this->actingAs($otherUser, 'sanctum')
            ->postJson('/api/conversations/'.$conversation->id.'/read')
            ->assertNotFound();
    }

    public function test_guest_order_updates_use_the_guest_token_conversation_and_remain_isolated(): void
    {
        $guestToken = str_repeat('g', 64);
        $otherToken = str_repeat('o', 64);
        $customer = Customer::create([
            'user_id' => null,
            'full_name' => 'Guest Order Customer',
            'contact_number' => '09170000010',
            'email' => 'guest-order@example.com',
        ]);
        $order = $this->orderFor($customer, 'ALD-COMM-005', [
            'guest_token_hash' => hash('sha256', $guestToken),
            'order_status' => 'confirmed',
        ]);
        $event = new OrderStatusChanged($order, 'order', $order->id, 'under_review', 'confirmed');

        app(OrderCommunicationService::class)->handle($event);

        $this->withHeader('X-Guest-Token', $guestToken)
            ->getJson('/api/conversations/current')
            ->assertOk()
            ->assertJsonPath('conversation.messages.0.message_type', 'order_update');

        $this->withHeader('X-Guest-Token', $otherToken)
            ->getJson('/api/conversations/current')
            ->assertNotFound();

        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('notifications', 0);
    }

    private function customerUser(string $prefix): User
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

    private function orderFor(Customer $customer, string $reference, array $attributes = []): OrderRequest
    {
        return OrderRequest::create([
            'order_reference' => $reference,
            'customer_id' => $customer->id,
            'fulfillment_type' => 'pickup',
            'order_status' => 'pending',
            'subtotal' => 100,
            'delivery_fee' => 0,
            'total_amount' => 100,
            ...$attributes,
        ]);
    }
}
