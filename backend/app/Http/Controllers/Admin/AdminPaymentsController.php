<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminPaymentIndexRequest;
use App\Http\Requests\AdminPaymentStatusUpdateRequest;
use App\Services\AdminPaymentService;
use Illuminate\Http\JsonResponse;

class AdminPaymentsController extends Controller
{
    public function __construct(private readonly AdminPaymentService $service) {}

    public function index(AdminPaymentIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function data(AdminPaymentIndexRequest $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(int $payment): JsonResponse
    {
        $record = $this->service->find($payment);

        if (! $record) {
            return response()->json(['message' => 'Payment not found.'], 404);
        }

        return response()->json(['payment' => $this->service->detail($record)]);
    }

    public function updateStatus(AdminPaymentStatusUpdateRequest $request, int $payment): JsonResponse
    {
        $record = $this->service->find($payment);

        if (! $record) {
            return response()->json(['message' => 'Payment not found.'], 404);
        }

        $record = $this->service->transition(
            $record,
            $request->validated('status'),
            $request->user(),
        );

        return response()->json([
            'message' => 'Payment status updated.',
            'payment' => $this->service->detail($record),
        ]);
    }
}
