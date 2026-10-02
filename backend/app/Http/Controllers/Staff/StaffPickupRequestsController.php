<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStaffPickupStatusRequest;
use App\Models\PickupRequest;
use App\Services\StaffPickupRequestPresenter;
use App\Services\StaffPickupStatusService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffPickupRequestsController extends Controller
{
    public function __construct(
        private readonly StaffPickupRequestPresenter $staffPickupRequestPresenter,
        private readonly StaffPickupStatusService $staffPickupStatusService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(PickupRequest::STATUS_VALUES),
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
        $pickups = $this->applyFilters(clone $baseQuery, $filters)
            ->with($this->pickupRelations())
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 10);

        return response()->json([
            'summary' => $this->summary($baseQuery),
            'pickup_requests' => $pickups->getCollection()
                ->map(fn (PickupRequest $pickupRequest): array => $this->staffPickupRequestPresenter->summary($pickupRequest))
                ->values(),
            'meta' => [
                'current_page' => $pickups->currentPage(),
                'last_page' => $pickups->lastPage(),
                'per_page' => $pickups->perPage(),
                'total' => $pickups->total(),
            ],
        ]);
    }

    public function data(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(Request $request, int $pickup): JsonResponse
    {
        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $record = $this->detailsQuery($staff->branch_id)->find($pickup);

        if (! $record) {
            return response()->json([
                'message' => 'Pickup request not found.',
            ], 404);
        }

        return response()->json([
            'pickup_request' => $this->staffPickupRequestPresenter->details(
                $record,
                $this->staffPickupStatusService->allowedStatuses($record),
            ),
        ]);
    }

    public function updateStatus(
        UpdateStaffPickupStatusRequest $request,
        int $pickup,
    ): JsonResponse {
        $staff = $request->user();
        $record = $this->detailsQuery($staff->branch_id)->find($pickup);

        if (! $record) {
            return response()->json([
                'message' => 'Pickup request not found.',
            ], 404);
        }

        $record = $this->staffPickupStatusService->transition(
            $record,
            $request->validated('status'),
        );
        $record->load($this->pickupRelations());

        return response()->json([
            'message' => 'Pickup status updated.',
            'pickup_request' => $this->staffPickupRequestPresenter->details(
                $record,
                $this->staffPickupStatusService->allowedStatuses($record),
            ),
        ]);
    }

    private function scopedQuery(int $branchId): Builder
    {
        return PickupRequest::query()->where('branch_id', $branchId);
    }

    private function detailsQuery(int $branchId): Builder
    {
        return $this->scopedQuery($branchId)->with($this->pickupRelations());
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search): void {
                $searchQuery
                    ->whereHas('order', function (Builder $orderQuery) use ($search): void {
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
            $query->where('pickup_status', $filters['status']);
        }

        return $query;
    }

    private function summary(Builder $query): array
    {
        $summary = [
            'total' => (clone $query)->count(),
            'active' => (clone $query)
                ->whereIn('pickup_status', ['pending', 'preparing', 'ready_for_pickup'])
                ->count(),
        ];

        foreach (PickupRequest::STATUS_VALUES as $status) {
            $summary[$status] = (clone $query)
                ->where('pickup_status', $status)
                ->count();
        }

        return $summary;
    }

    private function pickupRelations(): array
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
