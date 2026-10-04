<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStaffPaymentStatusRequest;
use App\Models\Payment;
use App\Services\StaffPaymentPresenter;
use App\Services\StaffPaymentStatusService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffPaymentsController extends Controller
{
    public function __construct(
        private readonly StaffPaymentPresenter $staffPaymentPresenter,
        private readonly StaffPaymentStatusService $staffPaymentStatusService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(Payment::STATUS_VALUES),
            ],
            'method' => ['sometimes', 'nullable', 'string', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $baseQuery = $this->scopedQuery($staff->branch_id);
        $payments = $this->applyFilters(clone $baseQuery, $filters)
            ->with($this->paymentRelations())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 10);

        return response()->json([
            'summary' => $this->summary($baseQuery),
            'payments' => $payments->getCollection()
                ->map(fn (Payment $payment): array => $this->staffPaymentPresenter->summary($payment))
                ->values(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(Request $request, int $payment): JsonResponse
    {
        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $record = $this->detailsQuery($staff->branch_id)->find($payment);

        if (! $record) {
            return response()->json([
                'message' => 'Payment not found.',
            ], 404);
        }

        return response()->json([
            'payment' => $this->staffPaymentPresenter->details(
                $record,
                $this->staffPaymentStatusService->allowedStatuses($record),
            ),
        ]);
    }

    public function updateStatus(
        UpdateStaffPaymentStatusRequest $request,
        int $payment,
    ): JsonResponse {
        $staff = $request->user();
        $record = $this->detailsQuery($staff->branch_id)->find($payment);

        if (! $record) {
            return response()->json([
                'message' => 'Payment not found.',
            ], 404);
        }

        $record = $this->staffPaymentStatusService->transition(
            $record,
            $request->validated('status'),
            $staff,
        );
        $record->load($this->paymentRelations());

        return response()->json([
            'message' => 'Payment status updated.',
            'payment' => $this->staffPaymentPresenter->details(
                $record,
                $this->staffPaymentStatusService->allowedStatuses($record),
            ),
        ]);
    }

    private function scopedQuery(int $branchId): Builder
    {
        return Payment::query()->whereHas(
            'order',
            fn (Builder $query): Builder => $query->where('branch_id', $branchId),
        );
    }

    private function detailsQuery(int $branchId): Builder
    {
        return $this->scopedQuery($branchId)->with($this->paymentRelations());
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search): void {
                $searchQuery
                    ->where('payment_reference', 'like', "%{$search}%")
                    ->orWhereHas('order', function (Builder $orderQuery) use ($search): void {
                        $orderQuery
                            ->where('order_reference', 'like', "%{$search}%")
                            ->orWhereHas('customer', function (Builder $customerQuery) use ($search): void {
                                $customerQuery
                                    ->where('full_name', 'like', "%{$search}%")
                                    ->orWhere('contact_number', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if (! empty($filters['status'])) {
            $query->where('payment_status', $filters['status']);
        }

        if (! empty($filters['method'])) {
            $query->where('payment_method', $filters['method']);
        }

        return $query;
    }

    private function summary(Builder $query): array
    {
        $summary = [
            'total' => (clone $query)->count(),
        ];

        foreach (Payment::STATUS_VALUES as $status) {
            $summary[$status] = (clone $query)
                ->where('payment_status', $status)
                ->count();
        }

        return $summary;
    }

    private function paymentRelations(): array
    {
        return [
            'order:id,order_reference,customer_id,branch_id,fulfillment_type,order_status,subtotal,delivery_fee,total_amount',
            'order.customer:id,full_name,contact_number,email',
            'order.branch:id,name,address,contact_number',
            'order.items:id,order_id,product_id,product_name,unit_price,quantity,subtotal',
            'verifiedBy:id,name',
        ];
    }
}
