<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminReportsIndexRequest;
use App\Services\AdminReportsService;
use Illuminate\Http\JsonResponse;

class AdminReportsController extends Controller
{
    public function __construct(private readonly AdminReportsService $service) {}

    public function data(AdminReportsIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->report($request->validated()));
    }
}
