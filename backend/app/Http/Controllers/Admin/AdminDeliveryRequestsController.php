<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class AdminDeliveryRequestsController extends Controller
{
    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'active_deliveries' => 2,
                'waiting_for_booking' => 1,
                'delivered_today' => 5,
                'total' => 20,
            ],
            'delivery_requests' => [
                ['id' => 1, 'order' => 'ALD-2026-000124', 'customer' => 'Carla Mendoza', 'destination' => 'Makati City', 'branch' => 'Makati', 'amount' => '₱2,470', 'fee' => 'To be confirmed', 'staff' => 'Mark Staff', 'status' => 'Waiting for Booking', 'action' => 'Manage', 'date' => '2026-08-08'],
                ['id' => 2, 'order' => 'ALD-2026-000123', 'customer' => 'Miguel Ramos', 'destination' => 'Sta. Ana, Manila', 'branch' => 'Manila', 'amount' => '₱3,260', 'fee' => '₱180', 'staff' => 'Staff User', 'status' => 'In Transit', 'action' => 'View', 'date' => '2026-08-08'],
                ['id' => 3, 'order' => 'ALD-2026-000119', 'customer' => 'Angela Cruz', 'destination' => 'Taguig City', 'branch' => 'Makati', 'amount' => '₱1,880', 'fee' => '₱160', 'staff' => 'Anna Staff', 'status' => 'Booked', 'action' => 'View', 'date' => '2026-08-08'],
                ['id' => 4, 'order' => 'ALD-2026-000117', 'customer' => 'Mark Reyes', 'destination' => 'Pasay City', 'branch' => 'Manila', 'amount' => '₱2,100', 'fee' => '₱150', 'staff' => 'Staff User', 'status' => 'Picked Up', 'action' => 'View', 'date' => '2026-08-08'],
                ['id' => 5, 'order' => 'ALD-2026-000110', 'customer' => 'Paolo Santos', 'destination' => 'Mandaluyong City', 'branch' => 'Manila', 'amount' => '₱1,560', 'fee' => '₱140', 'staff' => 'Anna Staff', 'status' => 'Delivered', 'action' => 'View', 'date' => '2026-08-07'],
                ['id' => 6, 'order' => 'ALD-2026-000108', 'customer' => 'Grace Lopez', 'destination' => 'Imus, Cavite', 'branch' => 'Imus', 'amount' => '₱2,820', 'fee' => '₱190', 'staff' => 'Staff User', 'status' => 'Delivered', 'action' => 'View', 'date' => '2026-08-07'],
                ['id' => 7, 'order' => 'ALD-2026-000105', 'customer' => 'Daniel Cruz', 'destination' => 'Makati City', 'branch' => 'Makati', 'amount' => '₱950', 'fee' => '₱130', 'staff' => 'Mark Staff', 'status' => 'Failed', 'action' => 'Review', 'date' => '2026-08-06'],
                ['id' => 8, 'order' => 'ALD-2026-000102', 'customer' => 'Maria Reyes', 'destination' => 'Manila', 'branch' => 'Manila', 'amount' => '₱1,340', 'fee' => '—', 'staff' => '—', 'status' => 'Cancelled', 'action' => 'View', 'date' => '2026-08-06'],
            ],
            'branches' => [
                ['branch' => 'Manila Branch', 'requests' => 8, 'active' => 1, 'delivered' => 7],
                ['branch' => 'Makati Branch', 'requests' => 7, 'active' => 1, 'delivered' => 6],
                ['branch' => 'Imus Branch', 'requests' => 5, 'active' => 0, 'delivered' => 5],
            ],
        ]);
    }
}
