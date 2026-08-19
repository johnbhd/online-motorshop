<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class StaffDeliveryRequestsController extends Controller
{
    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 16,
                'waiting_for_booking' => 1,
                'booked' => 1,
                'picked_up' => 1,
                'in_transit' => 1,
                'delivered' => 10,
                'failed' => 1,
                'cancelled' => 1,
                'active' => 2,
            ],
            'delivery_requests' => [
                ['id' => 124, 'order_reference' => 'ALD-2026-000124', 'customer' => 'Carla Mendoza', 'branch' => 'Makati Branch', 'destination' => 'Makati City', 'amount' => '₱2,470', 'payment' => 'Paid', 'delivery_status' => 'Waiting for Booking', 'updated' => '12 min ago', 'date_value' => '2026-08-07T10:00:00', 'action' => 'Manage Delivery'],
                ['id' => 123, 'order_reference' => 'ALD-2026-000123', 'customer' => 'Miguel Ramos', 'branch' => 'Manila Branch', 'destination' => 'Sta. Ana, Manila', 'amount' => '₱3,440', 'payment' => 'Paid', 'delivery_status' => 'In Transit', 'updated' => '25 min ago', 'date_value' => '2026-08-07T09:47:00', 'action' => 'View Delivery'],
                ['id' => 119, 'order_reference' => 'ALD-2026-000119', 'customer' => 'Angela Cruz', 'branch' => 'Makati Branch', 'destination' => 'Taguig City', 'amount' => '₱1,880', 'payment' => 'Paid', 'delivery_status' => 'Booked', 'updated' => '40 min ago', 'date_value' => '2026-08-07T09:32:00', 'action' => 'View Delivery'],
                ['id' => 117, 'order_reference' => 'ALD-2026-000117', 'customer' => 'Mark Reyes', 'branch' => 'Manila Branch', 'destination' => 'Pasay City', 'amount' => '₱2,100', 'payment' => 'Paid', 'delivery_status' => 'Picked Up', 'updated' => '1 hr ago', 'date_value' => '2026-08-07T09:12:00', 'action' => 'View Delivery'],
                ['id' => 110, 'order_reference' => 'ALD-2026-000110', 'customer' => 'Paolo Santos', 'branch' => 'Makati Branch', 'destination' => 'Mandaluyong City', 'amount' => '₱1,560', 'payment' => 'Paid', 'delivery_status' => 'Delivered', 'updated' => 'Yesterday', 'date_value' => '2026-08-06T16:00:00', 'action' => 'View Delivery'],
                ['id' => 108, 'order_reference' => 'ALD-2026-000108', 'customer' => 'Grace Lopez', 'branch' => 'Imus Branch', 'destination' => 'Imus, Cavite', 'amount' => '₱2,820', 'payment' => 'Paid', 'delivery_status' => 'Delivered', 'updated' => 'Yesterday', 'date_value' => '2026-08-06T13:00:00', 'action' => 'View Delivery'],
                ['id' => 105, 'order_reference' => 'ALD-2026-000105', 'customer' => 'Daniel Cruz', 'branch' => 'Makati Branch', 'destination' => 'Makati City', 'amount' => '₱950', 'payment' => 'Refunded', 'delivery_status' => 'Failed', 'updated' => 'Aug 5', 'date_value' => '2026-08-05T15:00:00', 'action' => 'View Delivery'],
                ['id' => 102, 'order_reference' => 'ALD-2026-000102', 'customer' => 'Maria Reyes', 'branch' => 'Manila Branch', 'destination' => 'Manila', 'amount' => '₱1,340', 'payment' => 'Cancelled', 'delivery_status' => 'Cancelled', 'updated' => 'Aug 5', 'date_value' => '2026-08-05T10:00:00', 'action' => 'View Delivery'],
            ],
        ]);
    }
}
