<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Tests\Fakes\FakeCloudinaryService;
use Tests\TestCase;

class ConversationsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');
        $app->instance(CloudinaryService::class, new FakeCloudinaryService);

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

    public function test_contact_inquiry_is_saved_as_structured_message_and_can_include_a_photo(): void
    {
        $metadata = json_encode([
            'full_name' => 'Guest Contact',
            'contact_number' => '09170000009',
            'email' => 'guest-contact@example.com',
            'inquiry_type' => 'Product Availability',
            'preferred_branch' => 'Manila Branch',
            'motorcycle' => 'Honda Click 125 2024',
            'product_needed' => 'Front brake pads',
            'message' => 'Do you have this part available?',
        ], JSON_THROW_ON_ERROR);

        $response = $this->post('/api/conversations', [
            'body' => 'Contact inquiry',
            'message_type' => 'contact_inquiry',
            'metadata' => $metadata,
            'attachment' => UploadedFile::fake()->create('brake-pads.jpg', 50, 'image/jpeg'),
        ])->assertCreated()
            ->assertJsonPath('conversation.messages.0.message_type', 'contact_inquiry')
            ->assertJsonPath('conversation.messages.0.metadata.inquiry_type', 'Product Availability')
            ->assertJsonPath('conversation.messages.0.attachment.url', fn (mixed $url): bool => is_string($url))
            ->assertJsonPath('conversation.messages.0.body', fn (mixed $body): bool => is_string($body) && str_contains($body, 'CONTACT INQUIRY'));

        $messageId = $response->json('conversation.messages.0.id');

        $this->assertDatabaseHas('messages', [
            'id' => $messageId,
            'message_type' => 'contact_inquiry',
            'attachment_public_id' => 'ald-motorshop/contact-inquiries/fake-1',
        ]);
    }

    public function test_contact_inquiry_rejects_an_unowned_order_reference(): void
    {
        $metadata = json_encode([
            'full_name' => 'Guest Contact',
            'contact_number' => '09170000009',
            'inquiry_type' => 'Existing Order',
            'order_reference' => 'ALD-2026-NOT-MINE',
            'message' => 'Please check this order.',
        ], JSON_THROW_ON_ERROR);

        $this->postJson('/api/conversations', [
            'body' => 'Contact inquiry',
            'message_type' => 'contact_inquiry',
            'metadata' => $metadata,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('metadata.order_reference');

        $this->assertDatabaseCount('conversations', 0);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_product_inquiry_persists_server_resolved_product_snapshot(): void
    {
        $category = Category::create([
            'name' => 'Brake System',
            'description' => null,
            'status' => 'active',
        ]);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Honda Front Brake Pad',
            'part_number' => 'HON-004',
            'brand' => 'Honda',
            'description' => 'Front brake pad set.',
            'price' => '650.00',
            'img_url' => 'https://cdn.example.test/honda-front-brake-pad.jpg',
            'availability_status' => 'active',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/conversations', [
            'body' => 'Is this available in Makati?',
            'message_type' => 'product_inquiry',
            'product_id' => $product->id,
        ])->assertCreated()
            ->assertJsonPath('conversation.messages.0.message_type', 'product_inquiry')
            ->assertJsonPath('conversation.messages.0.body', 'Is this available in Makati?')
            ->assertJsonPath('conversation.messages.0.metadata.product_id', $product->id)
            ->assertJsonPath('conversation.messages.0.metadata.part_number', 'HON-004')
            ->assertJsonPath('conversation.messages.0.metadata.product_name', 'Honda Front Brake Pad')
            ->assertJsonPath('conversation.messages.0.metadata.product_image_url', 'https://cdn.example.test/honda-front-brake-pad.jpg')
            ->assertJsonPath('conversation.messages.0.metadata.product_price', '650.00')
            ->assertJsonPath('conversation.messages.0.metadata.category', 'Brake System');

        $this->assertDatabaseHas('messages', [
            'id' => $response->json('conversation.messages.0.id'),
            'message_type' => 'product_inquiry',
        ]);
    }

    public function test_product_inquiry_requires_an_existing_product(): void
    {
        $this->postJson('/api/conversations', [
            'body' => 'Can I ask about a product?',
            'message_type' => 'product_inquiry',
            'product_id' => 999999,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('product_id');

        $this->assertDatabaseCount('conversations', 0);
        $this->assertDatabaseCount('messages', 0);
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
