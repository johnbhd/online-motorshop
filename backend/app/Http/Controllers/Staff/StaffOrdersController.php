<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\StaffOrderStatusUpdateRequest;
use App\Models\OrderRequest;
use App\Services\OrderRequestPresenter;
use App\Services\StaffOrderStatusService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffOrdersController extends Controller
{
    public function __construct(
        private readonly OrderRequestPresenter $orderRequestPresenter,
        private readonly StaffOrderStatusService $staffOrderStatusService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'status' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(OrderRequest::STAFF_STATUS_VALUES),
            ],
            'fulfillment' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(['pickup', 'delivery']),
            ],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $baseQuery = $this->scopedQuery($staff->branch_id);
        $query = $this->applyFilters($baseQuery, $filters);
        $orders = $query
            ->with([
                'customer:id,full_name,contact_number,email,address',
                'branch:id,name,address,contact_number',
                'payments:id,order_id,payment_method,amount,payment_reference,payment_status,created_at,verified_at',
            ])
            ->withCount('items')
            ->withSum('items', 'quantity')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 10);

        return response()->json([
            'summary' => $this->summary($this->scopedQuery($staff->branch_id)),
            'orders' => $orders->getCollection()
                ->map(fn (OrderRequest $order): array => $this->orderRequestPresenter->staffSummary($order))
                ->values(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(Request $request, string $reference): JsonResponse
    {
        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $order = $this->detailsQuery($staff->branch_id ?? 0)
            ->whereRaw('LOWER(order_reference) = ?', [strtolower(trim($reference))])
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        return response()->json([
            'order' => $this->staffDetail($order),
        ]);
    }

    public function updateStatus(
        StaffOrderStatusUpdateRequest $request,
        string $reference,
    ): JsonResponse {
        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $order = $this->detailsQuery($staff->branch_id ?? 0)
            ->whereRaw('LOWER(order_reference) = ?', [strtolower(trim($reference))])
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Order not found.',
            ], 404);
        }

        $order = $this->staffOrderStatusService->transition(
            $order,
            $request->validated('status'),
        );
        $order->load([
            'customer:id,full_name,contact_number,email,address,user_id',
            'branch:id,name,address,contact_number',
            'items.product:id,part_number,img_url',
            'payments:id,order_id,payment_method,amount,payment_reference,payment_status,created_at,verified_at',
            'pickupRequest.branch',
            'deliveryRequest.branch',
            'assignedStaff:id,name,email,branch_id',
        ]);

        return response()->json([
            'message' => 'Order status updated.',
            'order' => $this->staffDetail($order),
        ]);
    }

    private function scopedQuery(int $branchId): Builder
    {
        return OrderRequest::query()->where('branch_id', $branchId);
    }

    private function detailsQuery(int $branchId): Builder
    {
        return $this->scopedQuery($branchId)->with([
            'customer:id,full_name,contact_number,email,address,user_id',
            'branch:id,name,address,contact_number',
            'items.product:id,part_number,img_url',
            'payments:id,order_id,payment_method,amount,payment_reference,payment_status,created_at,verified_at',
            'pickupRequest.branch',
            'deliveryRequest.branch',
            'assignedStaff:id,name,email,branch_id',
        ]);
    }

    private function applyFilters(Builder $query, array $filters): Builder
    {
        $search = trim((string) ($filters['search'] ?? ''));

        if ($search !== '') {
            $query->where(function (Builder $searchQuery) use ($search): void {
                $searchQuery
                    ->where('order_reference', 'like', "%{$search}%")
                    ->orWhereHas('customer', function (Builder $customerQuery) use ($search): void {
                        $customerQuery
                            ->where('full_name', 'like', "%{$search}%")
                            ->orWhere('contact_number', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filters['status'])) {
            $query->where('order_status', $filters['status']);
        }

        if (! empty($filters['fulfillment'])) {
            $query->where('fulfillment_type', $filters['fulfillment']);
        }

        return $query;
    }

    private function summary(Builder $query): array
    {
        return [
            'total' => (clone $query)->count(),
            'pending' => (clone $query)->where('order_status', 'pending')->count(),
            'under_review' => (clone $query)->where('order_status', 'under_review')->count(),
            'confirmed' => (clone $query)->where('order_status', 'confirmed')->count(),
            'completed' => (clone $query)->where('order_status', 'completed')->count(),
        ];
    }

    private function staffDetail(OrderRequest $order): array
    {
        $payload = $this->orderRequestPresenter->staffDetail($order);
        $payload['allowed_statuses'] = $this->staffOrderStatusService->allowedStatuses($order);

        return $payload;
    }
}
