<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class StaffCustomersController extends Controller
{
    public function index(): View
    {
        return view('staff.customers.index');
    }

    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 124,
                'registered' => 47,
                'guest' => 77,
                'active_orders' => 18,
            ],
            'customers' => [
                ['id' => 1, 'name' => 'Mark Reyes', 'initials' => 'MR', 'type' => 'Registered', 'contact' => '0917 654 3281', 'email' => 'mark.reyes@email.com', 'branch' => 'Makati', 'orders' => 8, 'active_orders' => 1, 'last_order' => 'Aug 12, 2026', 'date_value' => '2026-08-12'],
                ['id' => 2, 'name' => 'Angela Cruz', 'initials' => 'AC', 'type' => 'Guest', 'contact' => '0995 284 7612', 'email' => 'angela.cruz@email.com', 'branch' => 'Makati', 'orders' => 3, 'active_orders' => 1, 'last_order' => 'Aug 12, 2026', 'date_value' => '2026-08-12'],
                ['id' => 3, 'name' => 'Paolo Santos', 'initials' => 'PS', 'type' => 'Registered', 'contact' => '0918 421 8956', 'email' => 'paolo.santos@email.com', 'branch' => 'Manila', 'orders' => 6, 'active_orders' => 1, 'last_order' => 'Aug 11, 2026', 'date_value' => '2026-08-11'],
                ['id' => 4, 'name' => 'Carla Mendoza', 'initials' => 'CM', 'type' => 'Guest', 'contact' => '0927 318 4450', 'email' => 'carla.m@email.com', 'branch' => 'Makati', 'orders' => 2, 'active_orders' => 0, 'last_order' => 'Aug 10, 2026', 'date_value' => '2026-08-10'],
                ['id' => 5, 'name' => 'Miguel Ramos', 'initials' => 'MR', 'type' => 'Registered', 'contact' => '0916 782 3104', 'email' => 'miguel.ramos@email.com', 'branch' => 'Imus', 'orders' => 11, 'active_orders' => 2, 'last_order' => 'Aug 10, 2026', 'date_value' => '2026-08-10'],
                ['id' => 6, 'name' => 'Grace Lopez', 'initials' => 'GL', 'type' => 'Guest', 'contact' => '0998 611 4920', 'email' => 'grace.lopez@email.com', 'branch' => 'Imus', 'orders' => 1, 'active_orders' => 0, 'last_order' => 'Aug 9, 2026', 'date_value' => '2026-08-09'],
                ['id' => 7, 'name' => 'Daniel Reyes', 'initials' => 'DR', 'type' => 'Registered', 'contact' => '0917 443 9810', 'email' => 'daniel.reyes@email.com', 'branch' => 'Manila', 'orders' => 5, 'active_orders' => 0, 'last_order' => 'Aug 8, 2026', 'date_value' => '2026-08-08'],
                ['id' => 8, 'name' => 'Maria Santos', 'initials' => 'MS', 'type' => 'Guest', 'contact' => '0920 874 1255', 'email' => 'maria.santos@email.com', 'branch' => 'Manila', 'orders' => 2, 'active_orders' => 0, 'last_order' => 'Aug 7, 2026', 'date_value' => '2026-08-07'],
            ],
        ]);
    }
}
