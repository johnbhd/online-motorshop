<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class AdminBranchesController extends Controller
{
    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total_branches' => 3,
                'pickup_available' => 3,
                'active_staff' => 9,
            ],
            'branches' => [
                [
                    'id' => 1,
                    'name' => 'Manila Branch',
                    'address' => '3333 New Panaderos, Sta. Ana, Manila, 1016 Metro Manila',
                    'contact' => '+63 995 869 1174',
                    'pickup_available' => true,
                    'assigned_staff' => 4,
                    'operating_hours_configured' => true,
                    'status' => 'Active',
                ],
                [
                    'id' => 2,
                    'name' => 'Makati Branch',
                    'address' => '3678 Bautista Street, Makati City',
                    'contact' => 'Contact configured',
                    'pickup_available' => true,
                    'assigned_staff' => 3,
                    'operating_hours_configured' => true,
                    'status' => 'Active',
                ],
                [
                    'id' => 3,
                    'name' => 'Imus Branch',
                    'address' => 'LYS Building, General Aguinaldo Highway, Imus, 4103 Cavite',
                    'contact' => 'Contact configured',
                    'pickup_available' => true,
                    'assigned_staff' => 2,
                    'operating_hours_configured' => true,
                    'status' => 'Active',
                ],
            ],
        ]);
    }
}
