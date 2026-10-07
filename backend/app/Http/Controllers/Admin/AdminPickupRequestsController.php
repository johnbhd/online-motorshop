<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminPickupRequestIndexRequest;
use App\Services\AdminPickupRequestService;
use Illuminate\Http\JsonResponse;

class AdminPickupRequestsController extends Controller
{
    public function __construct(private readonly AdminPickupRequestService $service) {}

    public function index(AdminPickupRequestIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function data(AdminPickupRequestIndexRequest $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(int $pickup): JsonResponse
    {
        $record = $this->service->find($pickup);

        if (! $record) {
            return response()->json(['message' => 'Pickup request not found.'], 404);
        }

        return response()->json([
            'pickup_request' => $this->service->detail($record),
        ]);
    }
}
