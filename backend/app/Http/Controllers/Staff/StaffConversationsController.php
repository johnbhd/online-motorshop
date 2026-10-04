<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\SendStaffConversationMessageRequest;
use App\Models\Conversation;
use App\Services\ConversationPresenter;
use App\Services\ConversationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffConversationsController extends Controller
{
    public function __construct(
        private readonly ConversationService $conversationService,
        private readonly ConversationPresenter $conversationPresenter,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(Conversation::STATUS_VALUES),
            ],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Conversation::query()
            ->with(['customer.user', 'latestMessage'])
            ->withCount('messages')
            ->orderByDesc('last_message_at')
            ->orderByDesc('id');

        $this->applyFilters($query, $filters);
        $conversations = $query->paginate($filters['per_page'] ?? 20);

        return response()->json([
            'summary' => $this->summary(),
            'conversations' => $conversations->getCollection()
                ->map(
                    fn (Conversation $conversation): array => $this->conversationPresenter->summary($conversation),
                )
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
            'conversation' => $this->conversationPresenter->details(
                $this->conversationService->loadConversation($conversation),
            ),
        ]);
    }

    public function storeMessage(
        SendStaffConversationMessageRequest $request,
        Conversation $conversation,
    ): JsonResponse {
        $this->conversationService->appendStaffMessage(
            $conversation,
            $request->user(),
            $request->validated('body'),
        );

        return response()->json([
            'conversation' => $this->conversationPresenter->details(
                $this->conversationService->loadConversation($conversation),
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
                    ->orWhere('id', is_numeric($search) ? (int) $search : -1);
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
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
                ->whereHas(
                    'latestMessage',
                    fn (Builder $messageQuery): Builder => $messageQuery->where('sender_type', 'customer'),
                )
                ->count(),
        ];
    }
}
