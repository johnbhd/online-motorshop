<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class StaffProductsController extends Controller
{
    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 86,
                'available' => 52,
                'low_stock' => 8,
                'subject_to_confirmation' => 10,
                'out_of_stock' => 7,
                'unavailable' => 5,
                'archived' => 4,
                'needs_attention' => 4,
            ],
            'products' => [
                ['id' => 1, 'name' => 'Genuine Honda Brake Pad Set', 'part_number' => 'HND-BP-001', 'brand' => 'Honda', 'category' => 'Brake Parts', 'price' => '₱850', 'availability' => 'Available', 'updated' => '10 min ago', 'date_value' => '2026-08-07T10:00:00', 'action' => 'View Product'],
                ['id' => 2, 'name' => 'Yamaha Motorcycle Battery', 'part_number' => 'YMH-BAT-014', 'brand' => 'Yamaha', 'category' => 'Batteries', 'price' => '₱1,650', 'availability' => 'Low Stock', 'updated' => '24 min ago', 'date_value' => '2026-08-07T09:46:00', 'action' => 'Update Status'],
                ['id' => 3, 'name' => 'Suzuki Air Filter', 'part_number' => 'SZK-AF-009', 'brand' => 'Suzuki', 'category' => 'Maintenance Parts', 'price' => '₱420', 'availability' => 'Out of Stock', 'updated' => '38 min ago', 'date_value' => '2026-08-07T09:32:00', 'action' => 'Update Status'],
                ['id' => 4, 'name' => 'Premium 4T Motorcycle Engine Oil', 'part_number' => 'OIL-4T-001', 'brand' => 'Universal', 'category' => 'Oils and Lubricants', 'price' => '₱380', 'availability' => 'Available', 'updated' => '1 hr ago', 'date_value' => '2026-08-07T09:10:00', 'action' => 'View Product'],
                ['id' => 5, 'name' => 'Front Brake Disc Rotor', 'part_number' => 'BRK-DSC-021', 'brand' => 'Universal', 'category' => 'Brake Parts', 'price' => '₱1,200', 'availability' => 'Subject to Confirmation', 'updated' => '2 hrs ago', 'date_value' => '2026-08-07T08:10:00', 'action' => 'Update Status'],
                ['id' => 6, 'name' => 'Motorcycle Spark Plug', 'part_number' => 'SPK-NGK-005', 'brand' => 'Universal', 'category' => 'Electrical Parts', 'price' => '₱180', 'availability' => 'Available', 'updated' => 'Today', 'date_value' => '2026-08-07T07:00:00', 'action' => 'View Product'],
                ['id' => 7, 'name' => 'Motorcycle Tire 70/90-17', 'part_number' => 'TIR-7090-017', 'brand' => 'Universal', 'category' => 'Tires', 'price' => '₱1,450', 'availability' => 'Low Stock', 'updated' => 'Today', 'date_value' => '2026-08-07T06:00:00', 'action' => 'Update Status'],
                ['id' => 8, 'name' => 'Honda Drive Belt', 'part_number' => 'HND-DB-032', 'brand' => 'Honda', 'category' => 'Maintenance Parts', 'price' => '₱780', 'availability' => 'Available', 'updated' => 'Yesterday', 'date_value' => '2026-08-06T16:00:00', 'action' => 'View Product'],
            ],
        ]);
    }
}
