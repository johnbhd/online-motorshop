<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class StaffPickupRequestsController extends Controller
{
    public function index(): View
    {
        return view('staff.pickup-requests.index');
    }

    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 18,
                'preparing' => 2,
                'ready_for_pickup' => 2,
                'completed' => 12,
                'cancelled' => 2,
                'active' => 4,
            ],
            'pickup_requests' => [
                [
                    'id' => 126,
                    'order_reference' => 'ALD-2026-000126',
                    'customer' => 'John Doe',
                    'branch' => 'Manila Branch',
                    'amount' => '₱3,260',
                    'payment' => 'Pay at Pickup',
                    'pickup_status' => 'Preparing',
                    'updated' => '10 min ago',
                    'date_value' => '2026-08-07T10:00:00',
                ],
                [
                    'id' => 125,
                    'order_reference' => 'ALD-2026-000125',
                    'customer' => 'Paolo Santos',
                    'branch' => 'Manila Branch',
                    'amount' => '₱920',
                    'payment' => 'Paid',
                    'pickup_status' => 'Ready for Pickup',
                    'updated' => '24 min ago',
                    'date_value' => '2026-08-07T09:46:00',
                ],
                [
                    'id' => 118,
                    'order_reference' => 'ALD-2026-000118',
                    'customer' => 'Maria Cruz',
                    'branch' => 'Makati Branch',
                    'amount' => '₱1,850',
                    'payment' => 'Paid',
                    'pickup_status' => 'Ready for Pickup',
                    'updated' => '42 min ago',
                    'date_value' => '2026-08-07T09:28:00',
                ],
                [
                    'id' => 116,
                    'order_reference' => 'ALD-2026-000116',
                    'customer' => 'Daniel Reyes',
                    'branch' => 'Imus Branch',
                    'amount' => '₱2,100',
                    'payment' => 'Pay at Pickup',
                    'pickup_status' => 'Preparing',
                    'updated' => '1 hr ago',
                    'date_value' => '2026-08-07T09:10:00',
                ],
                [
                    'id' => 111,
                    'order_reference' => 'ALD-2026-000111',
                    'customer' => 'Angela Ramos',
                    'branch' => 'Manila Branch',
                    'amount' => '₱1,450',
                    'payment' => 'Paid',
                    'pickup_status' => 'Completed',
                    'updated' => 'Yesterday',
                    'date_value' => '2026-08-06T16:00:00',
                ],
                [
                    'id' => 109,
                    'order_reference' => 'ALD-2026-000109',
                    'customer' => 'Mark Lopez',
                    'branch' => 'Makati Branch',
                    'amount' => '₱2,680',
                    'payment' => 'Paid',
                    'pickup_status' => 'Completed',
                    'updated' => 'Yesterday',
                    'date_value' => '2026-08-06T13:00:00',
                ],
                [
                    'id' => 103,
                    'order_reference' => 'ALD-2026-000103',
                    'customer' => 'Grace Santos',
                    'branch' => 'Imus Branch',
                    'amount' => '₱780',
                    'payment' => 'Paid',
                    'pickup_status' => 'Completed',
                    'updated' => 'Aug 5',
                    'date_value' => '2026-08-05T15:00:00',
                ],
                [
                    'id' => 101,
                    'order_reference' => 'ALD-2026-000101',
                    'customer' => 'Miguel Cruz',
                    'branch' => 'Manila Branch',
                    'amount' => '₱1,200',
                    'payment' => 'Cancelled',
                    'pickup_status' => 'Cancelled',
                    'updated' => 'Aug 5',
                    'date_value' => '2026-08-05T10:00:00',
                ],
            ],
        ]);
    }
}
