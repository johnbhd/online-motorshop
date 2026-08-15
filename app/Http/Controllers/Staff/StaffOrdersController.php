<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class StaffOrdersController extends Controller
{
    public function index(): View
    {
        return view('staff.orders.index');
    }

    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 48,
                'pending' => 8,
                'confirmed' => 12,
                'preparing' => 7,
                'ready_for_pickup' => 4,
                'delivery' => 2,
            ],
            'orders' => [
                [
                    'reference' => 'ALD-2026-000128',
                    'customer' => 'Mark Reyes',
                    'date' => 'Aug 7, 2026',
                    'date_value' => '2026-08-07',
                    'amount' => '₱1,850',
                    'fulfillment' => 'Store Pickup',
                    'payment' => 'Unpaid',
                    'status' => 'Pending',
                    'action' => 'Review Order',
                ],
                [
                    'reference' => 'ALD-2026-000127',
                    'customer' => 'Angela Cruz',
                    'date' => 'Aug 7, 2026',
                    'date_value' => '2026-08-07',
                    'amount' => '₱3,400',
                    'fulfillment' => 'Lalamove Delivery',
                    'payment' => 'Waiting for Verification',
                    'status' => 'Payment Verification',
                    'action' => 'Review Order',
                ],
                [
                    'reference' => 'ALD-2026-000126',
                    'customer' => 'John Doe',
                    'date' => 'Aug 7, 2026',
                    'date_value' => '2026-08-07',
                    'amount' => '₱3,260',
                    'fulfillment' => 'Store Pickup',
                    'payment' => 'Unpaid',
                    'status' => 'Preparing Order',
                    'action' => 'View Order',
                ],
                [
                    'reference' => 'ALD-2026-000125',
                    'customer' => 'Paolo Santos',
                    'date' => 'Aug 7, 2026',
                    'date_value' => '2026-08-07',
                    'amount' => '₱920',
                    'fulfillment' => 'Store Pickup',
                    'payment' => 'Pay at Pickup',
                    'status' => 'Ready for Pickup',
                    'action' => 'View Order',
                ],
                [
                    'reference' => 'ALD-2026-000124',
                    'customer' => 'Carla Mendoza',
                    'date' => 'Aug 7, 2026',
                    'date_value' => '2026-08-07',
                    'amount' => '₱2,470',
                    'fulfillment' => 'Lalamove Delivery',
                    'payment' => 'Paid',
                    'status' => 'Waiting for Booking',
                    'action' => 'View Order',
                ],
                [
                    'reference' => 'ALD-2026-000123',
                    'customer' => 'Miguel Ramos',
                    'date' => 'Aug 6, 2026',
                    'date_value' => '2026-08-06',
                    'amount' => '₱1,680',
                    'fulfillment' => 'Lalamove Delivery',
                    'payment' => 'Paid',
                    'status' => 'In Transit',
                    'action' => 'View Order',
                ],
                [
                    'reference' => 'ALD-2026-000122',
                    'customer' => 'Grace Santos',
                    'date' => 'Aug 6, 2026',
                    'date_value' => '2026-08-06',
                    'amount' => '₱2,150',
                    'fulfillment' => 'Store Pickup',
                    'payment' => 'Paid',
                    'status' => 'Completed',
                    'action' => 'View Order',
                ],
                [
                    'reference' => 'ALD-2026-000121',
                    'customer' => 'Daniel Cruz',
                    'date' => 'Aug 6, 2026',
                    'date_value' => '2026-08-06',
                    'amount' => '₱780',
                    'fulfillment' => 'Store Pickup',
                    'payment' => 'Cancelled',
                    'status' => 'Cancelled',
                    'action' => 'View Order',
                ],
            ],
        ]);
    }
}
