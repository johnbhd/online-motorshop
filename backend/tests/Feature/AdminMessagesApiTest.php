<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminMessagesApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_admin_conversation_routes_require_the_admin_role(): void
    {
        $guest = $this->startGuestConversation('A private customer thread.');
        $this->getJson('/api/admin/conversations')->assertUnauthorized();

        $staff = $this->createUser('staff');
        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/admin/conversations')
            ->assertForbidden();

        $customer = $this->createUser('customer');
        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/admin/conversations/'.$guest['id'].'/messages', ['body' => 'forged'])
            ->assertForbidden();
    }

    public function test_admin_can_search_and_filter_the_live_global_conversation_list(): void
    {
        $first = $this->startGuestConversation('Brake availability for Makati');
        $second = $this->startGuestConversation('Checking an oil filter');
        $staff = $this->createUser('staff');

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/staff/conversations/'.$first['id'].'/messages', [
                'body' => 'A Staff response.',
            ])->assertCreated();

        $admin = $this->createUser('admin');
        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/conversations?search=oil&needs_reply=1&page=1&per_page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonPath('summary.open', 2)
            ->assertJsonPath('summary.needs_reply', 1)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('conversations.0.id', $second['id']);

        $response->assertJsonMissingPath('conversations.0.guest_token_hash');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/messages/data?search=oil')
            ->assertOk()
            ->assertJsonPath('conversations.0.id', $second['id']);
    }

    public function test_admin_reply_is_persisted_in_the_shared_thread_with_server_derived_sender(): void
    {
        $guest = $this->startGuestConversation('Can I collect this tomorrow?');
        $staff = $this->createUser('staff');

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/staff/conversations/'.$guest['id'].'/messages', [
                'body' => 'The branch is checking availability.',
            ])->assertCreated();

        $admin = $this->createUser('admin');
        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/conversations/'.$guest['id'].'/messages', [
                'body' => 'sender fields are not trusted',
                'sender' => 'staff',
                'sender_type' => 'staff',
                'sender_user_id' => $staff->id,
            ])
            ->assertCreated()
            ->assertJsonPath('conversation.id', $guest['id'])
            ->assertJsonPath('conversation.messages.2.sender', 'admin')
            ->assertJsonPath('conversation.messages.2.sender_name', $admin->name)
            ->assertJsonPath('conversation.messages.2.body', 'sender fields are not trusted')
            ->assertJsonMissingPath('conversation.guest_token_hash')
            ->assertJsonMissingPath('conversation.messages.2.sender_user_id');

        $this->assertDatabaseHas('messages', [
            'conversation_id' => $guest['id'],
            'sender_type' => 'admin',
            'sender_user_id' => $admin->id,
            'body' => 'sender fields are not trusted',
        ]);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/staff/conversations/'.$guest['id'])
            ->assertOk()
            ->assertJsonPath('conversation.messages.2.sender', 'admin');

        $this->app['auth']->forgetGuards();

        $this->withHeader('X-Guest-Token', $guest['token'])
            ->getJson('/api/conversations/current')
            ->assertOk()
            ->assertJsonPath('conversation.messages.2.sender', 'admin');

        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('messages', 3);
    }

    public function test_admin_reply_rejects_empty_and_overlong_messages(): void
    {
        $guest = $this->startGuestConversation('Need help, please.');
        $admin = $this->createUser('admin');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/conversations/'.$guest['id'].'/messages', ['body' => '   '])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/admin/conversations/'.$guest['id'].'/messages', [
                'body' => str_repeat('x', 2001),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('body');

        $this->assertDatabaseCount('messages', 1);
    }

    /** @return array{id: int, token: string} */
    private function startGuestConversation(string $body): array
    {
        $response = $this->postJson('/api/conversations', ['body' => $body])->assertCreated();

        return [
            'id' => $response->json('conversation.id'),
            'token' => $response->json('guest_token'),
        ];
    }

    private function createUser(string $role): User
    {
        return User::create([
            'name' => ucfirst($role).' Messages User',
            'email' => $role.'-messages-'.uniqid().'@example.com',
            'password' => Hash::make('password'),
            'status' => 'active',
            'role' => $role,
        ]);
    }
}
