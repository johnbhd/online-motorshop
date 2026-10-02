<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Services\ConversationPresenter;
use App\Services\OrderRequestPresenter;
use App\Services\StaffOperationalSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffDashboardController extends Controller
{
    public function __construct(
        private readonly ConversationPresenter $conversationPresenter,
        private readonly OrderRequestPresenter $orderRequestPresenter,
        private readonly StaffOperationalSummaryService $summaryService,
    ) {}

    public function data(Request $request): JsonResponse
    {
        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $staff->loadMissing('branch:id,name');
        $dashboard = $this->summaryService->dashboard($staff->branch_id);

        return response()->json([
            'branch' => $staff->branch?->only(['id', 'name']),
            'summary' => $dashboard['summary'],
            'recent_orders' => $this->summaryService
                ->recentOrders($staff->branch_id)
                ->map(fn ($order): array => $this->orderRequestPresenter->staffSummary($order))
                ->values()
                ->all(),
            'recent_conversations' => $this->summaryService
                ->recentConversations()
                ->map(fn ($conversation): array => $this->conversationPresenter->summary($conversation))
                ->values()
                ->all(),
            'operational' => $dashboard['operational'],
        ]);
    }
}
