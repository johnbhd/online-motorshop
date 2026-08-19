<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class StaffDashboardController extends Controller
{
    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'pending_orders' => 8,
                'confirmed_orders' => 12,
                'payments_to_verify' => 3,
                'pickup_requests' => 4,
                'delivery_requests' => 2,
                'completed_today' => 15,
            ],
            'recent_orders' => [
                [
                    'reference' => 'ALD-2026-000126',
                    'customer' => 'John Doe',
                    'request' => 'Honda Brake Pad Set',
                    'fulfillment' => 'Store Pickup',
                    'status' => ['label' => 'Preparing', 'tone' => 'blue'],
                    'time' => '10 min ago',
                    'action' => ['label' => 'View Order', 'url' => '#'],
                ],
                [
                    'reference' => 'ALD-2026-000125',
                    'customer' => 'Paolo Santos',
                    'request' => 'Yamaha Motorcycle Battery',
                    'fulfillment' => 'Store Pickup',
                    'status' => ['label' => 'Ready for Pickup', 'tone' => 'green'],
                    'time' => '24 min ago',
                    'action' => ['label' => 'View Order', 'url' => '#'],
                ],
                [
                    'reference' => 'ALD-2026-000124',
                    'customer' => 'Carla Mendoza',
                    'request' => 'Premium 4T Motorcycle Engine Oil',
                    'fulfillment' => 'Lalamove Delivery',
                    'status' => ['label' => 'Waiting for Booking', 'tone' => 'orange'],
                    'time' => '35 min ago',
                    'action' => ['label' => 'View Order', 'url' => '#'],
                ],
                [
                    'reference' => 'ALD-2026-000123',
                    'customer' => 'Miguel Ramos',
                    'request' => 'Motorcycle Tire 70/90-17',
                    'fulfillment' => 'Lalamove Delivery',
                    'status' => ['label' => 'In Transit', 'tone' => 'violet'],
                    'time' => '1 hr ago',
                    'action' => ['label' => 'View Order', 'url' => '#'],
                ],
                [
                    'reference' => 'ALD-2026-000118',
                    'customer' => 'Maria Cruz',
                    'request' => 'Suzuki Air Filter',
                    'fulfillment' => 'Store Pickup',
                    'status' => ['label' => 'Completed', 'tone' => 'green'],
                    'time' => '2 hrs ago',
                    'action' => ['label' => 'View Order', 'url' => '#'],
                ],
            ],
            'operational_overview' => [
                'today_order_statuses' => [
                    ['label' => 'Pending', 'count' => 8, 'tone' => 'orange'],
                    ['label' => 'Confirmed', 'count' => 12, 'tone' => 'navy'],
                    ['label' => 'Preparing', 'count' => 7, 'tone' => 'blue'],
                    ['label' => 'Ready for Pickup', 'count' => 4, 'tone' => 'green'],
                    ['label' => 'In Delivery', 'count' => 2, 'tone' => 'violet'],
                    ['label' => 'Completed', 'count' => 15, 'tone' => 'emerald'],
                ],
                'fulfillment' => [
                    'pickup' => ['active' => 4, 'preparing' => 2, 'ready' => 2],
                    'delivery' => ['active' => 2, 'waiting' => 1, 'in_transit' => 1],
                ],
                'payment_overview' => [
                    ['label' => 'Waiting for Verification', 'count' => 3, 'icon' => 'fa-solid fa-clock', 'tone' => 'orange'],
                    ['label' => 'Paid Today', 'count' => 11, 'icon' => 'fa-solid fa-check', 'tone' => 'green'],
                    ['label' => 'Unpaid Confirmed Orders', 'count' => 5, 'icon' => 'fa-solid fa-exclamation', 'tone' => 'orange'],
                ],
                'product_alerts' => [
                    ['name' => 'Honda Brake Pad Set', 'availability' => 'Low Stock', 'tone' => 'orange', 'action' => 'Update'],
                    ['name' => 'Yamaha Motorcycle Battery', 'availability' => 'Low Stock', 'tone' => 'orange', 'action' => 'Update'],
                    ['name' => 'Suzuki Air Filter', 'availability' => 'Out of Stock', 'tone' => 'red', 'action' => 'Update'],
                    ['name' => 'Motorcycle Tire 70/90-17', 'availability' => 'Subject to Confirmation', 'tone' => 'blue', 'action' => 'Review'],
                ],
                'recent_inquiries' => [
                    ['customer' => 'Mark Reyes', 'message' => 'Available po ba yung Honda Click brake pad?', 'category' => 'Product Availability', 'time' => '12 min ago', 'status' => 'Unread', 'tone' => 'orange'],
                    ['customer' => 'Angela Cruz', 'message' => 'Pwede po ba Lalamove delivery to Makati?', 'category' => 'Delivery Inquiry', 'time' => '31 min ago', 'status' => 'Unread', 'tone' => 'orange'],
                    ['customer' => 'Paolo Santos', 'message' => 'Ready na po ba pickup order ko?', 'category' => 'Existing Order', 'time' => '1 hr ago', 'status' => 'Replied', 'tone' => 'green'],
                ],
                'recent_activities' => [
                    ['description' => 'Order ALD-2026-000126 marked Preparing Order', 'time' => '15 min ago', 'icon' => 'fa-solid fa-box', 'tone' => 'orange'],
                    ['description' => 'Payment for ALD-2026-000119 verified', 'time' => '28 min ago', 'icon' => 'fa-solid fa-check', 'tone' => 'green'],
                    ['description' => 'ALD-2026-000125 marked Ready for Pickup', 'time' => '42 min ago', 'icon' => 'fa-solid fa-store', 'tone' => 'emerald'],
                    ['description' => 'Lalamove booking added to ALD-2026-000118', 'time' => '1 hr ago', 'icon' => 'fa-solid fa-motorcycle', 'tone' => 'orange'],
                    ['description' => 'Product Yamaha Battery updated to Low Stock', 'time' => '2 hrs ago', 'icon' => 'fa-solid fa-box-open', 'tone' => 'blue'],
                ],
            ],
        ]);
    }
}
