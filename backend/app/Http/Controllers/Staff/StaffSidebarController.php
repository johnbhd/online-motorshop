<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffSidebarController extends Controller
{
    public function data(Request $request): JsonResponse
    {
        $staff = $request->user();

        if ($staff?->branch_id === null) {
            return response()->json([
                'message' => 'Staff account is not assigned to a branch.',
            ], 403);
        }

        $branchId = $staff->branch_id;
        $orders = OrderRequest::query()->where('branch_id', $branchId);
        $payments = Payment::query()->whereHas(
            'order',
            fn (Builder $query): Builder => $query->where('branch_id', $branchId),
        );
        $pickups = PickupRequest::query()->where('branch_id', $branchId);
        $deliveries = DeliveryRequest::query()->where('branch_id', $branchId);

        return response()->json([
            'counts' => [
                'orders' => (clone $orders)
                    ->where('order_status', 'pending')
                    ->count(),
                'payments' => (clone $payments)
                    ->where('payment_status', 'waiting_for_verification')
                    ->count(),
                'pickup_requests' => (clone $pickups)
                    ->whereIn('pickup_status', [
                        'pending',
                        'preparing',
                        'ready_for_pickup',
                    ])
                    ->count(),
                'delivery_requests' => (clone $deliveries)
                    ->whereIn('delivery_status', [
                        'waiting_for_booking',
                        'booked',
                        'picked_up',
                        'in_transit',
                    ])
                    ->count(),
            ],
            'meta' => [
                'messages' => 'unavailable',
            ],
        ]);
    }
}
