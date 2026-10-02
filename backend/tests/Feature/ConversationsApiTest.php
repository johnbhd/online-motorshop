<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ConversationsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_guest_conversation_is_created_with_a_returned_token_and_is_owned_by_that_token(): void
    {
        $this->getJson('/api/conversations/current')->assertNotFound();

        $response = $this->postJson('/api/conversations', [
            'body' => 'I need help with an order.',
        ])->assertCreated()
            ->assertJsonPath('conversation.participant_type', 'guest')
            ->assertJsonPath('conversation.messages.0.sender', 'customer')
            ->assertJsonPath('conversation.messages.0.body', 'I need help with an order.');

        $guestToken = $response->json('guest_token');
        $conversationId = $response->json('conversation.id');

        $this->assertIsString($guestToken);
        $this->assertSame(64, strlen($guestToken));
        $this->assertDatabaseHas('conversations', [
            'id' => $conversationId,
            'guest_token_hash' => hash('sha256', $guestToken),
        ]);
        $this->assertDatabaseCount('messages', 1);

        $this->withHeader('X-Guest-Token', $guestToken)
            ->getJson('/api/conversations/current')
            ->assertOk()
            ->assertJsonPath('conversation.id', $conversationId);

        $this->withHeader('X-Guest-Token', str_repeat('x', 64))
            ->getJson('/api/conversations/current')
            ->assertNotFound();

        $this->postJson('/api/conversations/'.$conversationId.'/messages', [
            'body' => 'Here is a follow-up.',
            'guest_token' => $guestToken,
        ])->assertCreated()
            ->assertJsonCount(2, 'conversation.messages');

        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('messages', 2);
    }

    public function test_authenticated_customer_uses_one_owned_conversation(): void
    {
        $customerUser = User::create([
            'name' => 'Conversation Customer',
            'email' => 'conversation-customer-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        $customer = Customer::create([
            'user_id' => $customerUser->id,
            'full_name' => 'Conversation Customer',
            'contact_number' => '09170000000',
            'email' => $customerUser->email,
        ]);
        $token = $customerUser->createToken('conversation-test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/conversations', [
                'body' => 'Hello staff.',
                'sender' => 'staff',
            ])
            ->assertCreated()
            ->assertJsonPath('conversation.participant.id', $customer->id)
            ->assertJsonPath('conversation.messages.0.sender', 'customer')
            ->assertJsonMissingPath('guest_token');

        $this->withToken($token)
            ->postJson('/api/conversations', ['body' => 'I have one more question.'])
            ->assertOk()
            ->assertJsonCount(2, 'conversation.messages');

        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('messages', 2);
    }

    public function test_staff_can_list_read_and_reply_but_customer_cannot_use_staff_routes(): void
    {
        $customerUser = User::create([
            'name' => 'Message Customer',
            'email' => 'message-customer-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'customer',
        ]);
        Customer::create([
            'user_id' => $customerUser->id,
            'full_name' => 'Message Customer',
            'contact_number' => '09170000001',
            'email' => $customerUser->email,
        ]);
        $customerToken = $customerUser->createToken('conversation-customer')->plainTextToken;

        $conversationId = $this->withToken($customerToken)
            ->postJson('/api/conversations', ['body' => 'Can you help?'])
            ->json('conversation.id');

        $staff = User::create([
            'name' => 'Message Staff',
            'email' => 'message-staff-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => 'staff',
        ]);
        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/staff/conversations')
            ->assertOk()
            ->assertJsonPath('summary.needs_reply', 1)
            ->assertJsonPath('conversations.0.id', $conversationId);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/staff/conversations/'.$conversationId)
            ->assertOk()
            ->assertJsonPath('conversation.messages.0.sender', 'customer');

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/staff/conversations/'.$conversationId.'/messages', [
                'body' => 'A staff reply.',
                'sender' => 'customer',
            ])->assertCreated()
            ->assertJsonPath('conversation.messages.1.sender', 'staff');

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversationId,
            'sender_type' => 'staff',
            'sender_user_id' => $staff->id,
            'body' => 'A staff reply.',
        ]);

        $this->actingAs($customerUser, 'sanctum')
            ->getJson('/api/staff/conversations')
            ->assertForbidden();
    }

    public function test_message_body_is_required_and_limited(): void
    {
        $this->postJson('/api/conversations', ['body' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');

        $this->postJson('/api/conversations', ['body' => str_repeat('x', 2001)])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');

        $this->assertDatabaseCount('conversations', 0);
    }

    public function test_invalid_bearer_tokens_do_not_fall_back_to_guest_access(): void
    {
        $this->withToken('invalid-token')
            ->postJson('/api/conversations', ['body' => 'Should not be guest access.'])
            ->assertUnauthorized();

        $this->assertDatabaseCount('conversations', 0);
        $this->assertDatabaseCount('messages', 0);
    }
}
