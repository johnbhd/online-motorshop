<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class AdminCustomersController extends Controller
{
    public function index(): View
    {
        return view('admin.customers.index');
    }

    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 124,
                'registered' => 47,
                'guest' => 77,
                'customers_this_month' => 31,
                'returning' => 27,
            ],
            'customers' => [
                [
                    'id' => 1,
                    'initials' => 'MR',
                    'name' => 'Mark Reyes',
                    'type' => 'Registered',
                    'contact' => '0917 XXX XXXX',
                    'email' => 'mark.reyes@example.com',
                    'location' => 'Manila',
                    'branch' => 'Manila',
                    'orders' => 3,
                    'total_ordered' => '₱5,420',
                    'last_order' => 'Aug 8, 2026',
                    'last_order_date' => '2026-08-08',
                    'status' => 'Returning',
                    'active_orders' => 1,
                ],
                [
                    'id' => 2,
                    'initials' => 'AC',
                    'name' => 'Angela Cruz',
                    'type' => 'Guest',
                    'contact' => '0918 XXX XXXX',
                    'email' => 'angela.cruz@example.com',
                    'location' => 'Makati City',
                    'branch' => 'Makati',
                    'orders' => 2,
                    'total_ordered' => '₱6,150',
                    'last_order' => 'Aug 8, 2026',
                    'last_order_date' => '2026-08-08',
                    'status' => 'Returning',
                    'active_orders' => 1,
                ],
                [
                    'id' => 3,
                    'initials' => 'JD',
                    'name' => 'John Doe',
                    'type' => 'Guest',
                    'contact' => '0919 XXX XXXX',
                    'email' => 'john.doe@example.com',
                    'location' => 'Sta. Ana, Manila',
                    'branch' => 'Manila',
                    'orders' => 1,
                    'total_ordered' => '₱3,260',
                    'last_order' => 'Aug 7, 2026',
                    'last_order_date' => '2026-08-07',
                    'status' => 'New',
                    'active_orders' => 0,
                ],
                [
                    'id' => 4,
                    'initials' => 'PS',
                    'name' => 'Paolo Santos',
                    'type' => 'Registered',
                    'contact' => '0920 XXX XXXX',
                    'email' => 'paolo.santos@example.com',
                    'location' => 'Manila',
                    'branch' => 'Manila',
                    'orders' => 4,
                    'total_ordered' => '₱7,680',
                    'last_order' => 'Aug 7, 2026',
                    'last_order_date' => '2026-08-07',
                    'status' => 'Returning',
                    'active_orders' => 0,
                ],
                [
                    'id' => 5,
                    'initials' => 'CM',
                    'name' => 'Carla Mendoza',
                    'type' => 'Guest',
                    'contact' => '0921 XXX XXXX',
                    'email' => 'carla.mendoza@example.com',
                    'location' => 'Makati City',
                    'branch' => 'Makati',
                    'orders' => 1,
                    'total_ordered' => '₱2,470',
                    'last_order' => 'Aug 7, 2026',
                    'last_order_date' => '2026-08-07',
                    'status' => 'New',
                    'active_orders' => 1,
                ],
                [
                    'id' => 6,
                    'initials' => 'MR',
                    'name' => 'Miguel Ramos',
                    'type' => 'Registered',
                    'contact' => '0922 XXX XXXX',
                    'email' => 'miguel.ramos@example.com',
                    'location' => 'Pasay City',
                    'branch' => 'Manila',
                    'orders' => 2,
                    'total_ordered' => '₱4,920',
                    'last_order' => 'Aug 6, 2026',
                    'last_order_date' => '2026-08-06',
                    'status' => 'Returning',
                    'active_orders' => 0,
                ],
                [
                    'id' => 7,
                    'initials' => 'GS',
                    'name' => 'Grace Santos',
                    'type' => 'Guest',
                    'contact' => '0923 XXX XXXX',
                    'email' => 'grace.santos@example.com',
                    'location' => 'Imus, Cavite',
                    'branch' => 'Imus',
                    'orders' => 1,
                    'total_ordered' => '₱2,150',
                    'last_order' => 'Aug 6, 2026',
                    'last_order_date' => '2026-08-06',
                    'status' => 'New',
                    'active_orders' => 0,
                ],
                [
                    'id' => 8,
                    'initials' => 'DC',
                    'name' => 'Daniel Cruz',
                    'type' => 'Registered',
                    'contact' => '0924 XXX XXXX',
                    'email' => 'daniel.cruz@example.com',
                    'location' => 'Mandaluyong City',
                    'branch' => 'Makati',
                    'orders' => 2,
                    'total_ordered' => '₱2,980',
                    'last_order' => 'Aug 5, 2026',
                    'last_order_date' => '2026-08-05',
                    'status' => 'Returning',
                    'active_orders' => 0,
                ],
            ],
        ]);
    }
}
