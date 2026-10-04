<?php

namespace App\Http\Controllers;

use App\Http\Requests\SendConversationMessageRequest;
use App\Http\Requests\StartConversationRequest;
use App\Models\Conversation;
use App\Services\ConversationPresenter;
use App\Services\ConversationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function __construct(
        private readonly ConversationService $conversationService,
        private readonly ConversationPresenter $conversationPresenter,
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

        $result = $this->conversationService->start(
            $user,
            $validated['guest_token'] ?? null,
            $validated['body'],
        );

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

        $this->conversationService->appendCustomerMessage(
            $conversation,
            $user,
            $request->validated('body'),
        );

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
}
