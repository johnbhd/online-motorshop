<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminOrderAssignmentRequest;
use App\Http\Requests\AdminOrderIndexRequest;
use App\Http\Requests\AdminOrderStatusUpdateRequest;
use App\Services\AdminOrderService;
use Illuminate\Http\JsonResponse;

class AdminOrdersController extends Controller
{
    public function __construct(private readonly AdminOrderService $service) {}

    public function index(AdminOrderIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function data(AdminOrderIndexRequest $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(string $reference): JsonResponse
    {
        $order = $this->service->find($reference);

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        return response()->json([
            'order' => $this->service->detail($order),
            'assignable_staff' => $this->service->assignableStaff($order),
        ]);
    }

    public function updateStatus(AdminOrderStatusUpdateRequest $request, string $reference): JsonResponse
    {
        $order = $this->service->find($reference);

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $order = $this->service->transition($order, $request->validated('status'));

        return response()->json([
            'message' => 'Order status updated.',
            'order' => $this->service->detail($order),
        ]);
    }

    public function updateAssignment(AdminOrderAssignmentRequest $request, string $reference): JsonResponse
    {
        $order = $this->service->find($reference);

        if (! $order) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        $order = $this->service->assign($order, $request->validated('staff_id'));

        return response()->json([
            'message' => 'Order assignment updated.',
            'order' => $this->service->detail($order),
        ]);
    }
}
