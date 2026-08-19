<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class AdminStaffController extends Controller
{
    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 9,
                'active' => 8,
                'inactive' => 1,
            ],
            'staff' => [
                [
                    'id' => 1,
                    'name' => 'Staff User',
                    'email' => 'staff@aldmotorshop.com',
                    'role' => 'Order Processing Staff',
                    'branch' => 'Manila Branch',
                    'status' => 'Active',
                    'last_active' => '5 min ago',
                ],
                [
                    'id' => 2,
                    'name' => 'Anna Staff',
                    'email' => 'anna@aldmotorshop.com',
                    'role' => 'Branch Staff',
                    'branch' => 'Manila Branch',
                    'status' => 'Active',
                    'last_active' => '18 min ago',
                ],
                [
                    'id' => 3,
                    'name' => 'Mark Staff',
                    'email' => 'mark@aldmotorshop.com',
                    'role' => 'Branch Staff',
                    'branch' => 'Makati Branch',
                    'status' => 'Active',
                    'last_active' => '32 min ago',
                ],
                [
                    'id' => 4,
                    'name' => 'Carlo Staff',
                    'email' => 'carlo@aldmotorshop.com',
                    'role' => 'Order Processing Staff',
                    'branch' => 'Makati Branch',
                    'status' => 'Active',
                    'last_active' => '1 hr ago',
                ],
                [
                    'id' => 5,
                    'name' => 'Maria Staff',
                    'email' => 'maria@aldmotorshop.com',
                    'role' => 'Branch Staff',
                    'branch' => 'Imus Branch',
                    'status' => 'Active',
                    'last_active' => '2 hrs ago',
                ],
                [
                    'id' => 6,
                    'name' => 'Daniel Staff',
                    'email' => 'daniel@aldmotorshop.com',
                    'role' => 'Branch Staff',
                    'branch' => 'Imus Branch',
                    'status' => 'Active',
                    'last_active' => 'Today',
                ],
                [
                    'id' => 7,
                    'name' => 'Paolo Staff',
                    'email' => 'paolo@aldmotorshop.com',
                    'role' => 'Order Processing Staff',
                    'branch' => 'Manila Branch',
                    'status' => 'Active',
                    'last_active' => 'Yesterday',
                ],
                [
                    'id' => 8,
                    'name' => 'Grace Staff',
                    'email' => 'grace@aldmotorshop.com',
                    'role' => 'Branch Staff',
                    'branch' => 'Makati Branch',
                    'status' => 'Inactive',
                    'last_active' => 'Aug 3, 2026',
                ],
            ],
        ]);
    }
}
