<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\StaffReportsIndexRequest;
use App\Services\StaffReportsService;
use Illuminate\Http\JsonResponse;

class StaffReportsController extends Controller
{
    public function __construct(private readonly StaffReportsService $service) {}

    public function data(StaffReportsIndexRequest $request): JsonResponse
    {
        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $staff->loadMissing('branch:id,name');

        return response()->json(
            $this->service->report($request->validated(), $staff->branch),
        );
    }
}
