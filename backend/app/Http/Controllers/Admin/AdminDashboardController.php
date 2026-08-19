<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total_orders' => 48,
                'payments_to_verify' => 3,
                'active_fulfillment' => 6,
                'pickup_active' => 4,
                'delivery_active' => 2,
                'new_inquiries' => 5,
            ],
            'recent_orders' => [
                ['reference' => 'ALD-2026-000128', 'customer' => 'Mark Reyes', 'branch' => 'Manila', 'amount' => '₱1,850', 'fulfillment' => 'Store Pickup', 'status' => 'Pending'],
                ['reference' => 'ALD-2026-000127', 'customer' => 'Angela Cruz', 'branch' => 'Makati', 'amount' => '₱3,400', 'fulfillment' => 'Lalamove Delivery', 'status' => 'Payment Verification'],
                ['reference' => 'ALD-2026-000126', 'customer' => 'John Doe', 'branch' => 'Manila', 'amount' => '₱3,260', 'fulfillment' => 'Store Pickup', 'status' => 'Preparing'],
                ['reference' => 'ALD-2026-000125', 'customer' => 'Paolo Santos', 'branch' => 'Manila', 'amount' => '₱920', 'fulfillment' => 'Store Pickup', 'status' => 'Ready for Pickup'],
                ['reference' => 'ALD-2026-000124', 'customer' => 'Carla Mendoza', 'branch' => 'Makati', 'amount' => '₱2,470', 'fulfillment' => 'Lalamove Delivery', 'status' => 'Waiting for Booking'],
            ],
            'needs_attention' => [
                ['icon' => 'fa-regular fa-credit-card', 'tone' => 'green', 'title' => 'Payment Verification', 'description' => '3 payments waiting for verification', 'action' => 'Review'],
                ['icon' => 'fa-regular fa-clipboard', 'tone' => 'orange', 'title' => 'Pending Orders', 'description' => '8 orders waiting for review', 'action' => 'View'],
                ['icon' => 'fa-solid fa-box', 'tone' => 'blue', 'title' => 'Product Availability', 'description' => '8 products marked Low Stock', 'action' => 'View'],
                ['icon' => 'fa-regular fa-message', 'tone' => 'orange', 'title' => 'New Messages', 'description' => '5 customer inquiries waiting', 'action' => 'View'],
                ['icon' => 'fa-regular fa-user', 'tone' => 'slate', 'title' => 'Staff Account', 'description' => '1 staff account requires review', 'action' => 'Review'],
            ],
            'branches' => [
                ['name' => 'Manila Branch', 'orders' => 24, 'pickup' => 8, 'delivery' => 6],
                ['name' => 'Makati Branch', 'orders' => 15, 'pickup' => 5, 'delivery' => 7],
                ['name' => 'Imus Branch', 'orders' => 9, 'pickup' => 3, 'delivery' => 1],
            ],
            'recent_activity' => [
                ['icon' => 'fa-solid fa-circle-check', 'tone' => 'green', 'description' => 'Payment for ALD-2026-000119 verified', 'actor' => 'Admin User', 'time' => '42 min ago'],
                ['icon' => 'fa-solid fa-store', 'tone' => 'orange', 'description' => 'ALD-2026-000125 marked Ready for Pickup', 'actor' => 'Staff User', 'time' => '1 hr ago'],
                ['icon' => 'fa-solid fa-box', 'tone' => 'blue', 'description' => 'Yamaha Motorcycle Battery updated to Low Stock', 'actor' => 'Staff User', 'time' => '1 hr ago'],
                ['icon' => 'fa-solid fa-user-check', 'tone' => 'slate', 'description' => 'Staff account activated for Makati Branch', 'actor' => 'Admin User', 'time' => '2 hrs ago'],
                ['icon' => 'fa-solid fa-pen-to-square', 'tone' => 'orange', 'description' => 'Homepage featured product updated', 'actor' => 'Admin User', 'time' => 'Today'],
            ],
        ]);
    }
}
