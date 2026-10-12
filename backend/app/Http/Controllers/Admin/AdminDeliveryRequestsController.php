<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminDeliveryRequestIndexRequest;
use App\Http\Requests\UpdateAdminDeliveryStatusRequest;
use App\Services\AdminDeliveryRequestService;
use App\Services\StaffDeliveryStatusService;
use Illuminate\Http\JsonResponse;

class AdminDeliveryRequestsController extends Controller
{
    public function __construct(
        private readonly AdminDeliveryRequestService $service,
        private readonly StaffDeliveryStatusService $statusService,
    ) {}

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
            'delivery_request' => $this->service->detail(
                $record,
                $this->statusService->allowedStatuses($record),
            ),
        ]);
    }

    public function updateStatus(
        UpdateAdminDeliveryStatusRequest $request,
        int $delivery,
    ): JsonResponse {
        $record = $this->service->find($delivery);

        if (! $record) {
            return response()->json(['message' => 'Delivery request not found.'], 404);
        }

        $record = $this->statusService->transition(
            $record,
            $request->validated('status'),
            $request->safe()->only([
                'booking_reference',
                'tracking_url',
                'rider_name',
                'rider_contact',
                'vehicle_plate',
                'remarks',
            ]),
        );

        return response()->json([
            'message' => 'Delivery status updated.',
            'delivery_request' => $this->service->detail(
                $record,
                $this->statusService->allowedStatuses($record),
            ),
        ]);
    }
}
