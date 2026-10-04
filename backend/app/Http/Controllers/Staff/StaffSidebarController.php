<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Services\StaffOperationalSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffSidebarController extends Controller
{
    public function __construct(
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

        $counts = $this->summaryService->sidebarCounts($staff->branch_id);

        return response()->json([
            'counts' => $counts,
        ]);
    }
}
