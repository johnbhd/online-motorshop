<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class StaffNotificationsController extends Controller
{
    public function index(): View
    {
        return view('staff.notifications.index');
    }

    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 18,
                'unread' => 8,
                'read' => 10,
            ],
            'notifications' => [
                [
                    'id' => 1,
                    'type' => 'Orders',
                    'icon' => 'fa-regular fa-clipboard',
                    'title' => 'New order request',
                    'description' => 'Mark Reyes submitted order ALD-2026-000128.',
                    'time' => '5 min ago',
                    'unread' => true,
                ],
                [
                    'id' => 2,
                    'type' => 'Payments',
                    'icon' => 'fa-solid fa-credit-card',
                    'title' => 'Payment needs verification',
                    'description' => 'Payment proof for ALD-2026-000127 is waiting for Staff verification.',
                    'time' => '12 min ago',
                    'unread' => true,
                ],
                [
                    'id' => 3,
                    'type' => 'Pickup',
                    'icon' => 'fa-solid fa-store',
                    'title' => 'Pickup request updated',
                    'description' => 'Order ALD-2026-000125 is currently being prepared for pickup.',
                    'time' => '28 min ago',
                    'unread' => false,
                ],
                [
                    'id' => 4,
                    'type' => 'Messages',
                    'icon' => 'fa-regular fa-message',
                    'title' => 'New customer message',
                    'description' => 'Angela Cruz sent a new customer inquiry.',
                    'time' => '35 min ago',
                    'unread' => true,
                ],
                [
                    'id' => 5,
                    'type' => 'Delivery',
                    'icon' => 'fa-solid fa-truck-fast',
                    'title' => 'Delivery waiting for booking',
                    'description' => 'ALD-2026-000124 needs a Lalamove booking.',
                    'time' => '48 min ago',
                    'unread' => true,
                ],
                [
                    'id' => 6,
                    'type' => 'Reviews',
                    'icon' => 'fa-solid fa-flag',
                    'title' => 'Review needs Admin attention',
                    'description' => 'A customer review has been flagged as inappropriate.',
                    'time' => '1 hr ago',
                    'unread' => false,
                ],
                [
                    'id' => 7,
                    'type' => 'Product',
                    'icon' => 'fa-solid fa-box',
                    'title' => 'Product availability needs attention',
                    'description' => 'Yamaha Motorcycle Battery is currently marked Low Stock.',
                    'time' => '2 hrs ago',
                    'unread' => false,
                ],
                [
                    'id' => 8,
                    'type' => 'Orders',
                    'icon' => 'fa-regular fa-circle-check',
                    'title' => 'Order completed',
                    'description' => 'ALD-2026-000122 has been marked Completed.',
                    'time' => '3 hrs ago',
                    'unread' => false,
                ],
            ],
        ]);
    }
}
