<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class AdminOrdersController extends Controller
{
    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 48,
                'pending' => 8,
                'under_review' => 4,
                'confirmed' => 7,
                'preparing' => 6,
                'ready_for_pickup' => 4,
                'delivery' => 2,
            ],
            'orders' => [
                ['id' => 1, 'reference' => 'ALD-2026-000128', 'customer' => 'Mark Reyes', 'branch' => 'Manila', 'amount' => '₱1,850', 'fulfillment' => 'Store Pickup', 'assigned_staff' => 'Unassigned', 'status' => 'Pending', 'updated' => '10 min ago', 'date_value' => '2026-08-08T17:50:00', 'action' => 'Review'],
                ['id' => 2, 'reference' => 'ALD-2026-000127', 'customer' => 'Angela Cruz', 'branch' => 'Makati', 'amount' => '₱3,400', 'fulfillment' => 'Lalamove Delivery', 'assigned_staff' => 'Staff User', 'status' => 'Under Review', 'updated' => '24 min ago', 'date_value' => '2026-08-08T17:36:00', 'action' => 'View'],
                ['id' => 3, 'reference' => 'ALD-2026-000126', 'customer' => 'John Doe', 'branch' => 'Manila', 'amount' => '₱3,260', 'fulfillment' => 'Store Pickup', 'assigned_staff' => 'Staff User', 'status' => 'Preparing', 'updated' => '38 min ago', 'date_value' => '2026-08-08T17:22:00', 'action' => 'View'],
                ['id' => 4, 'reference' => 'ALD-2026-000125', 'customer' => 'Paolo Santos', 'branch' => 'Manila', 'amount' => '₱920', 'fulfillment' => 'Store Pickup', 'assigned_staff' => 'Anna Staff', 'status' => 'Ready for Pickup', 'updated' => '1 hr ago', 'date_value' => '2026-08-08T17:00:00', 'action' => 'View'],
                ['id' => 5, 'reference' => 'ALD-2026-000124', 'customer' => 'Carla Mendoza', 'branch' => 'Makati', 'amount' => '₱2,470', 'fulfillment' => 'Lalamove Delivery', 'assigned_staff' => 'Mark Staff', 'status' => 'Waiting for Booking', 'updated' => '1 hr ago', 'date_value' => '2026-08-08T16:30:00', 'action' => 'View'],
                ['id' => 6, 'reference' => 'ALD-2026-000123', 'customer' => 'Miguel Ramos', 'branch' => 'Manila', 'amount' => '₱3,440', 'fulfillment' => 'Lalamove Delivery', 'assigned_staff' => 'Staff User', 'status' => 'In Transit', 'updated' => '2 hrs ago', 'date_value' => '2026-08-08T15:30:00', 'action' => 'View'],
                ['id' => 7, 'reference' => 'ALD-2026-000122', 'customer' => 'Grace Santos', 'branch' => 'Imus', 'amount' => '₱2,150', 'fulfillment' => 'Store Pickup', 'assigned_staff' => 'Anna Staff', 'status' => 'Completed', 'updated' => 'Yesterday', 'date_value' => '2026-08-07T15:00:00', 'action' => 'View'],
                ['id' => 8, 'reference' => 'ALD-2026-000121', 'customer' => 'Daniel Cruz', 'branch' => 'Makati', 'amount' => '₱780', 'fulfillment' => 'Store Pickup', 'assigned_staff' => 'Mark Staff', 'status' => 'Cancelled', 'updated' => 'Yesterday', 'date_value' => '2026-08-07T14:00:00', 'action' => 'View'],
            ],
        ]);
    }
}
