<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStaffDeliveryStatusRequest;
use App\Models\DeliveryRequest;
use App\Services\StaffDeliveryRequestPresenter;
use App\Services\StaffDeliveryStatusService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffDeliveryRequestsController extends Controller
{
    public function __construct(
        private readonly StaffDeliveryRequestPresenter $staffDeliveryRequestPresenter,
        private readonly StaffDeliveryStatusService $staffDeliveryStatusService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(DeliveryRequest::STATUS_VALUES),
            ],
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
        $deliveries = $this->applyFilters(clone $baseQuery, $filters)
            ->with($this->deliveryRelations())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 10);

        return response()->json([
            'summary' => $this->summary($baseQuery),
            'delivery_requests' => $deliveries->getCollection()
                ->map(fn (DeliveryRequest $deliveryRequest): array => $this->staffDeliveryRequestPresenter->summary($deliveryRequest))
                ->values(),
            'meta' => [
                'current_page' => $deliveries->currentPage(),
                'last_page' => $deliveries->lastPage(),
                'per_page' => $deliveries->perPage(),
                'total' => $deliveries->total(),
            ],
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(Request $request, int $delivery): JsonResponse
    {
        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $record = $this->detailsQuery($staff->branch_id)->find($delivery);

        if (! $record) {
            return response()->json([
                'message' => 'Delivery request not found.',
            ], 404);
        }

        return response()->json([
            'delivery_request' => $this->staffDeliveryRequestPresenter->details(
                $record,
                $this->staffDeliveryStatusService->allowedStatuses($record),
            ),
        ]);
    }

    public function updateStatus(
        UpdateStaffDeliveryStatusRequest $request,
        int $delivery,
    ): JsonResponse {
        $staff = $request->user();
        $record = $this->detailsQuery($staff->branch_id)->find($delivery);

        if (! $record) {
            return response()->json([
                'message' => 'Delivery request not found.',
            ], 404);
        }

        $record = $this->staffDeliveryStatusService->transition(
            $record,
            $request->validated('status'),
            $request->safe()->only([
                'booking_reference',
                'tracking_url',
                'rider_name',
                'rider_contact',
                'remarks',
            ]),
        );
        $record->load($this->deliveryRelations());

        return response()->json([
            'message' => 'Delivery status updated.',
            'delivery_request' => $this->staffDeliveryRequestPresenter->details(
                $record,
                $this->staffDeliveryStatusService->allowedStatuses($record),
            ),
        ]);
    }

    private function scopedQuery(int $branchId): Builder
    {
        return DeliveryRequest::query()->where('branch_id', $branchId);
    }

    private function detailsQuery(int $branchId): Builder
    {
        return $this->scopedQuery($branchId)->with($this->deliveryRelations());
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search): void {
                $searchQuery
                    ->where('booking_reference', 'like', "%{$search}%")
                    ->orWhereHas('order', function (Builder $orderQuery) use ($search): void {
                        $orderQuery
                            ->where('order_reference', 'like', "%{$search}%")
                            ->orWhereHas('customer', function (Builder $customerQuery) use ($search): void {
                                $customerQuery
                                    ->where('full_name', 'like', "%{$search}%")
                                    ->orWhere('contact_number', 'like', "%{$search}%");
                            });
                    })
                    ->orWhereHas('branch', function (Builder $branchQuery) use ($search): void {
                        $branchQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['status'])) {
            $query->where('delivery_status', $filters['status']);
        }

        return $query;
    }

    private function summary(Builder $query): array
    {
        $summary = [
            'total' => (clone $query)->count(),
            'active' => (clone $query)
                ->whereIn('delivery_status', [
                    'waiting_for_booking',
                    'booked',
                    'picked_up',
                    'in_transit',
                ])
                ->count(),
        ];

        foreach (DeliveryRequest::STATUS_VALUES as $status) {
            $summary[$status] = (clone $query)
                ->where('delivery_status', $status)
                ->count();
        }

        return $summary;
    }

    private function deliveryRelations(): array
    {
        return [
            'order:id,order_reference,customer_id,branch_id,fulfillment_type,order_status,subtotal,delivery_fee,total_amount',
            'order.customer:id,full_name,contact_number,email,address',
            'order.items:id,order_id,product_id,product_name,unit_price,quantity,subtotal',
            'order.items.product:id,part_number',
            'order.payments:id,order_id,payment_method,amount,payment_reference,payment_status,verified_at,created_at',
            'branch:id,name,address,contact_number',
            'assignedStaff:id,name',
        ];
    }
}
