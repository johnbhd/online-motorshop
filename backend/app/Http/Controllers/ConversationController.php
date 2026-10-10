<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendConversationMessageRequest;
use App\Http\Requests\StartConversationRequest;
use App\Models\Conversation;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Models\User;
use App\Services\CloudinaryService;
use App\Services\CloudinaryServiceException;
use App\Services\ConversationPresenter;
use App\Services\ConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class ConversationController extends Controller
{
    public function __construct(
        private readonly ConversationService $conversationService,
        private readonly ConversationPresenter $conversationPresenter,
        private readonly CloudinaryService $cloudinaryService,
    ) {}

    public function current(Request $request): JsonResponse
    {
        $user = $this->requester($request);
        $this->ensureCustomerOrGuest($user);

        $conversation = $this->conversationService->findCurrent(
            $user,
            $request->header('X-Guest-Token'),
        );

        if (! $conversation) {
            return response()->json([
                'message' => 'Conversation not found.',
            ], 404);
        }

        return response()->json([
            'conversation' => $this->conversationPresenter->details($conversation),
        ]);
    }

    public function store(StartConversationRequest $request): JsonResponse
    {
        $user = $this->requester($request);
        $this->ensureCustomerOrGuest($user);
        $validated = $request->validated();

        try {
            $attributes = $this->customerMessageAttributes($request, $user, $validated);
        } catch (CloudinaryServiceException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }

        try {
            $result = $this->conversationService->start(
                $user,
                $validated['guest_token'] ?? null,
                $attributes['body'],
                $attributes['message_type'],
                $attributes['metadata'],
                $attributes['attachment'],
            );
        } catch (Throwable $exception) {
            $this->cleanupAttachment($attributes['attachment']);
            throw $exception;
        }

        $payload = [
            'conversation' => $this->conversationPresenter->details($result['conversation']),
        ];

        if ($result['guest_token'] !== null) {
            $payload['guest_token'] = $result['guest_token'];
        }

        return response()->json($payload, $result['created'] ? 201 : 200);
    }

    public function storeMessage(
        SendConversationMessageRequest $request,
        Conversation $conversation,
    ): JsonResponse {
        $user = $this->requester($request);
        $this->ensureCustomerOrGuest($user);

        if (! $this->conversationBelongsToRequester(
            $conversation,
            $user,
            $request->validated('guest_token'),
        )) {
            return response()->json([
                'message' => 'Conversation not found.',
            ], 404);
        }

        try {
            $attributes = $this->customerMessageAttributes($request, $user, $request->validated());
        } catch (CloudinaryServiceException $exception) {
            return response()->json(['message' => $exception->getMessage()], 503);
        }

        try {
            $this->conversationService->appendCustomerMessage(
                $conversation,
                $user,
                $attributes['body'],
                $attributes['message_type'],
                $attributes['metadata'],
                $attributes['attachment'],
            );
        } catch (Throwable $exception) {
            $this->cleanupAttachment($attributes['attachment']);
            throw $exception;
        }

        return response()->json([
            'conversation' => $this->conversationPresenter->details(
                $this->conversationService->loadConversation($conversation),
            ),
        ], 201);
    }

    private function ensureCustomerOrGuest($user): void
    {
        if ($user && $user->role !== 'customer') {
            abort(403, 'Only customer accounts may use customer conversations.');
        }
    }

    private function requester(Request $request)
    {
        $user = $request->user('sanctum');

        if ($request->bearerToken() !== null && ! $user) {
            abort(401, 'Unauthenticated');
        }

        return $user;
    }

    private function conversationBelongsToRequester(
        Conversation $conversation,
        $user,
        ?string $guestToken,
    ): bool {
        if ($user?->customer) {
            return $conversation->customer_id === $user->customer->id
                && $conversation->participant_type === 'customer'
                && $conversation->status === 'open';
        }

        return $guestToken !== null
            && hash_equals(
                (string) $conversation->guest_token_hash,
                hash('sha256', trim($guestToken)),
            )
            && $conversation->participant_type === 'guest'
            && $conversation->status === 'open';
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{body: string, message_type: string, metadata: array<string, mixed>|null, attachment: array{secure_url: string, public_id: string}|null}
     */
    private function customerMessageAttributes(Request $request, ?User $user, array $validated): array
    {
        $messageType = (string) ($validated['message_type'] ?? 'text');
        $metadataJson = $validated['metadata'] ?? null;

        if ($messageType === 'text') {
            if ($metadataJson !== null || $request->hasFile('attachment')) {
                throw ValidationException::withMessages([
                    'message_type' => ['Metadata and attachments are only supported for contact or product inquiries.'],
                ]);
            }

            return [
                'body' => $validated['body'],
                'message_type' => 'text',
                'metadata' => null,
                'attachment' => null,
            ];
        }

        if ($messageType === 'product_inquiry') {
            if ($metadataJson !== null || $request->hasFile('attachment')) {
                throw ValidationException::withMessages([
                    'message_type' => ['Product inquiries use the selected product context and do not accept custom metadata or attachments.'],
                ]);
            }

            $product = Product::query()
                ->with([
                    'category:id,name',
                    'brandRecord:id,name',
                ])
                ->find($validated['product_id'] ?? null);

            if (! $product) {
                throw ValidationException::withMessages([
                    'product_id' => ['The selected product could not be found.'],
                ]);
            }

            return [
                'body' => $validated['body'],
                'message_type' => 'product_inquiry',
                'metadata' => [
                    'product_id' => (int) $product->id,
                    'part_number' => (string) $product->part_number,
                    'product_name' => (string) $product->name,
                    'product_image_url' => $product->img_url,
                    'product_price' => (string) $product->price,
                    'brand' => $product->brandRecord?->name ?? $product->brand,
                    'category' => $product->category?->name,
                ],
                'attachment' => null,
            ];
        }

        if (! is_string($metadataJson) || $metadataJson === '') {
            throw ValidationException::withMessages([
                'metadata' => ['Contact inquiry details are required.'],
            ]);
        }

        $metadata = json_decode($metadataJson, true);

        if (! is_array($metadata)) {
            throw ValidationException::withMessages([
                'metadata' => ['Contact inquiry details must be a valid object.'],
            ]);
        }

        $metadata = $this->normalizeInquiryMetadata($metadata, $user);
        $this->ensureInquiryOrderOwnership($metadata, $user);

        $body = $this->formatInquiryBody($metadata);

        $attachment = null;

        if ($request->hasFile('attachment')) {
            $attachment = $this->cloudinaryService->uploadImage(
                $request->file('attachment'),
                'ald-motorshop/contact-inquiries',
            );
        }

        return [
            'body' => $body,
            'message_type' => 'contact_inquiry',
            'metadata' => $metadata,
            'attachment' => $attachment,
        ];
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return array<string, string>
     */
    private function normalizeInquiryMetadata(array $metadata, ?User $user): array
    {
        $fields = [
            'full_name' => 120,
            'contact_number' => 40,
            'email' => 160,
            'inquiry_type' => 80,
            'preferred_branch' => 120,
            'motorcycle' => 160,
            'product_needed' => 180,
            'order_reference' => 100,
            'message' => 1200,
        ];
        $normalized = [];

        foreach ($fields as $field => $maxLength) {
            $value = trim((string) ($metadata[$field] ?? ''));

            if ($value !== '') {
                $normalized[$field] = mb_substr($value, 0, $maxLength);
            }
        }

        $allowedInquiryTypes = [
            'Product Availability',
            'Product Price',
            'Motorcycle Part Compatibility',
            'Existing Order',
            'Payment Concern',
            'Lalamove Delivery',
            'Store Promo',
            'Maintenance or Repair Service',
        ];

        if (! in_array($normalized['inquiry_type'] ?? null, $allowedInquiryTypes, true)) {
            throw ValidationException::withMessages([
                'metadata.inquiry_type' => ['Choose a valid inquiry type.'],
            ]);
        }

        if ($user?->customer) {
            $normalized['full_name'] = $user->customer->full_name ?: $user->name;
            $normalized['contact_number'] = (string) $user->customer->contact_number;
            $normalized['email'] = (string) $user->email;
        }

        foreach (['full_name', 'contact_number', 'message'] as $requiredField) {
            if (($normalized[$requiredField] ?? '') === '') {
                throw ValidationException::withMessages([
                    "metadata.{$requiredField}" => ['This field is required for a contact inquiry.'],
                ]);
            }
        }

        return $normalized;
    }

    /** @param  array<string, string>  $metadata */
    private function ensureInquiryOrderOwnership(array $metadata, ?User $user): void
    {
        $reference = trim((string) ($metadata['order_reference'] ?? ''));

        if ($reference === '') {
            return;
        }

        $query = OrderRequest::query()
            ->whereRaw('LOWER(order_reference) = ?', [mb_strtolower($reference)]);

        if ($user?->customer) {
            $query->where('customer_id', $user->customer->id);
        } else {
            $query->whereHas('customer', function ($customerQuery) use ($metadata): void {
                $customerQuery
                    ->whereNull('user_id')
                    ->where('contact_number', $metadata['contact_number']);
            });
        }

        if (! $query->exists()) {
            throw ValidationException::withMessages([
                'metadata.order_reference' => ['That order reference could not be verified for this customer.'],
            ]);
        }
    }

    /** @param  array<string, string>|null  $metadata */
    private function formatInquiryBody(array $metadata): string
    {
        $labels = [
            'inquiry_type' => 'Inquiry Type',
            'full_name' => 'Customer',
            'contact_number' => 'Contact Number',
            'email' => 'Email',
            'preferred_branch' => 'Preferred Branch',
            'motorcycle' => 'Motorcycle',
            'product_needed' => 'Product / Part Needed',
            'order_reference' => 'Order Reference',
        ];
        $lines = ['CONTACT INQUIRY', ''];

        foreach ($labels as $field => $label) {
            if (($metadata[$field] ?? '') !== '') {
                $lines[] = "{$label}:";
                $lines[] = $metadata[$field];
                $lines[] = '';
            }
        }

        $lines[] = 'Message:';
        $lines[] = $metadata['message'];

        $body = implode("\n", $lines);

        if (mb_strlen($body) > 2000) {
            throw ValidationException::withMessages([
                'metadata.message' => ['The formatted contact inquiry is too long. Please shorten the message.'],
            ]);
        }

        return $body;
    }

    /** @param  array{secure_url: string, public_id: string}|null  $attachment */
    private function cleanupAttachment(?array $attachment): void
    {
        if ($attachment !== null) {
            $this->cloudinaryService->deleteImage($attachment['public_id']);
        }
    }
}
