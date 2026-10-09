<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminConversationIndexRequest;
use App\Http\Requests\SendAdminConversationMessageRequest;
use App\Models\Conversation;
use App\Services\ConversationPresenter;
use App\Services\ConversationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

class AdminMessagesController extends Controller
{
    public function __construct(
        private readonly ConversationService $conversationService,
        private readonly ConversationPresenter $conversationPresenter,
    ) {}

    public function index(AdminConversationIndexRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $query = Conversation::query()
            ->with(['customer.user', 'latestMessage.senderUser'])
            ->withCount('messages')
            ->orderByDesc('last_message_at')
            ->orderByDesc('id');

        $this->applyFilters($query, $filters);
        $conversations = $query->paginate($filters['per_page'] ?? 20);

        return response()->json([
            'summary' => $this->summary(),
            'conversations' => $conversations->getCollection()
                ->map(fn (Conversation $conversation): array => $this->conversationPresenter->summaryForAdmin($conversation))
                ->values(),
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
            ],
        ]);
    }

    public function show(Conversation $conversation): JsonResponse
    {
        return response()->json([
            'conversation' => $this->conversationPresenter->detailsForAdmin(
                $this->conversationService->loadConversation($conversation, true),
            ),
        ]);
    }

    public function storeMessage(
        SendAdminConversationMessageRequest $request,
        Conversation $conversation,
    ): JsonResponse {
        $this->conversationService->appendAdminMessage(
            $conversation,
            $request->user(),
            $request->validated('body'),
        );

        return response()->json([
            'conversation' => $this->conversationPresenter->detailsForAdmin(
                $this->conversationService->loadConversation($conversation, true),
            ),
        ], 201);
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search): void {
                $searchQuery
                    ->whereHas('customer', function (Builder $customerQuery) use ($search): void {
                        $customerQuery
                            ->where('full_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('contact_number', 'like', "%{$search}%");
                    })
                    ->orWhere('id', is_numeric($search) ? (int) $search : -1)
                    ->orWhereHas('messages', fn (Builder $messageQuery): Builder => $messageQuery
                        ->where('body', 'like', "%{$search}%"));
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (array_key_exists('needs_reply', $filters)) {
            $needsReply = filter_var($filters['needs_reply'], FILTER_VALIDATE_BOOLEAN);
            $needsReplyQuery = fn (Builder $messageQuery): Builder => $messageQuery
                ->where('sender_type', 'customer');

            if ($needsReply) {
                $query->where('status', 'open')->whereHas('latestMessage', $needsReplyQuery);
            } else {
                $query->whereDoesntHave('latestMessage', $needsReplyQuery);
            }
        }
    }

    private function summary(): array
    {
        $query = Conversation::query();

        return [
            'total' => (clone $query)->count(),
            'open' => (clone $query)->where('status', 'open')->count(),
            'needs_reply' => (clone $query)
                ->where('status', 'open')
                ->whereHas('latestMessage', fn (Builder $messageQuery): Builder => $messageQuery
                    ->where('sender_type', 'customer'))
                ->count(),
        ];
    }
}
