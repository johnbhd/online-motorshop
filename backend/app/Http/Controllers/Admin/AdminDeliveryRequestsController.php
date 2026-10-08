<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminDeliveryRequestIndexRequest;
use App\Services\AdminDeliveryRequestService;
use Illuminate\Http\JsonResponse;

class AdminDeliveryRequestsController extends Controller
{
    public function __construct(private readonly AdminDeliveryRequestService $service) {}

    public function index(AdminDeliveryRequestIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function data(AdminDeliveryRequestIndexRequest $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(int $delivery): JsonResponse
    {
        $record = $this->service->find($delivery);

        if (! $record) {
            return response()->json(['message' => 'Delivery request not found.'], 404);
        }

        return response()->json([
            'delivery_request' => $this->service->detail($record),
        ]);
    }
}
