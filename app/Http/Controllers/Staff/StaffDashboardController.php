<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\View\View;

class StaffDashboardController extends Controller
{
    public function index(): View
    {
        return view('staff.dashboard');
    }

    public function data(): JsonResponse
    {
        $summary = [
            'pending_orders' => OrderRequest::query()
                ->where('order_status', 'pending')
                ->count(),
            'confirmed_orders' => OrderRequest::query()
                ->where('order_status', 'confirmed')
                ->count(),
            'payments_to_verify' => Payment::query()
                ->whereIn('payment_status', [
                    'pending',
                    'waiting_for_verification',
                ])
                ->count(),
            'pickup_requests' => PickupRequest::query()
                ->whereNotIn('pickup_status', [
                    'completed',
                    'cancelled',
                    'rejected',
                ])
                ->count(),
            'delivery_requests' => DeliveryRequest::query()
                ->whereNotIn('delivery_status', [
                    'delivered',
                    'completed',
                    'cancelled',
                    'rejected',
                ])
                ->count(),
            'completed_today' => OrderRequest::query()
                ->where('order_status', 'completed')
                ->whereDate('updated_at', today())
                ->count(),
        ];

        $recentOrders = OrderRequest::query()
            ->with([
                'customer:id,full_name',
                'items:id,order_id,product_name',
            ])
            ->latest()
            ->limit(5)
            ->get([
                'id',
                'order_reference',
                'customer_id',
                'fulfillment_type',
                'order_status',
                'created_at',
            ])
            ->map(function (OrderRequest $order): array {
                $primaryItem = $order->items->first()?->product_name
                    ?? 'Order Request';
                $additionalItems = max($order->items->count() - 1, 0);
                $request = $additionalItems > 0
                    ? "{$primaryItem} +{$additionalItems} more"
                    : $primaryItem;

                return [
                    'reference' => $order->order_reference,
                    'customer' => $order->customer?->full_name ?? 'Guest Customer',
                    'request' => $request,
                    'fulfillment' => Str::headline($order->fulfillment_type),
                    'status' => [
                        'label' => Str::headline($order->order_status),
                        'tone' => $this->statusTone($order->order_status),
                    ],
                    'time' => $order->created_at?->diffForHumans() ?? '',
                    'action' => [
                        'label' => 'View Order',
                        'url' => '#',
                    ],
                ];
            })
            ->values();

        return response()->json([
            'summary' => $summary,
            'recent_orders' => $recentOrders,
        ]);
    }

    private function statusTone(string $status): string
    {
        return match ($status) {
            'pending', 'waiting_for_booking' => 'orange',
            'confirmed', 'preparing', 'preparing_order' => 'blue',
            'completed', 'delivered', 'ready_for_pickup' => 'green',
            'needs_confirmation' => 'violet',
            default => 'slate',
        };
    }
}
