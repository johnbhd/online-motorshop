<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class AdminProductController extends Controller
{
    public function index(): View
    {
        return view('admin.products.index');
    }

    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 86,
                'available' => 52,
                'needs_attention' => 18,
                'out_of_stock' => 7,
                'low_stock' => 8,
                'subject_to_confirmation' => 10,
                'unavailable' => 5,
                'archived' => 4,
            ],
            'products' => [
                ['id' => 1, 'name' => 'Genuine Honda Brake Pad Set', 'part_number' => 'HND-BP-001', 'brand' => 'Honda', 'category' => 'Brake Parts', 'price' => '₱850', 'availability' => 'Available', 'status' => 'Active', 'updated' => '10 min ago', 'date_value' => '2026-08-08T17:50:00'],
                ['id' => 2, 'name' => 'Yamaha Motorcycle Battery', 'part_number' => 'YMH-BAT-014', 'brand' => 'Yamaha', 'category' => 'Batteries', 'price' => '₱1,650', 'availability' => 'Low Stock', 'status' => 'Active', 'updated' => '24 min ago', 'date_value' => '2026-08-08T17:36:00'],
                ['id' => 3, 'name' => 'Suzuki Air Filter', 'part_number' => 'SZK-AF-009', 'brand' => 'Suzuki', 'category' => 'Maintenance Parts', 'price' => '₱420', 'availability' => 'Out of Stock', 'status' => 'Active', 'updated' => '38 min ago', 'date_value' => '2026-08-08T17:22:00'],
                ['id' => 4, 'name' => 'Premium 4T Motorcycle Engine Oil', 'part_number' => 'OIL-4T-001', 'brand' => 'Universal', 'category' => 'Oils & Lubricants', 'price' => '₱380', 'availability' => 'Available', 'status' => 'Active', 'updated' => '1 hr ago', 'date_value' => '2026-08-08T17:00:00'],
                ['id' => 5, 'name' => 'Front Brake Disc Rotor', 'part_number' => 'BRK-DSC-021', 'brand' => 'Universal', 'category' => 'Brake Parts', 'price' => '₱1,200', 'availability' => 'Subject to Confirmation', 'status' => 'Active', 'updated' => '2 hrs ago', 'date_value' => '2026-08-08T16:00:00'],
                ['id' => 6, 'name' => 'Motorcycle Spark Plug', 'part_number' => 'SPK-NGK-005', 'brand' => 'Universal', 'category' => 'Electrical Parts', 'price' => '₱180', 'availability' => 'Available', 'status' => 'Active', 'updated' => 'Today', 'date_value' => '2026-08-08T14:00:00'],
                ['id' => 7, 'name' => 'Motorcycle Tire 70/90-17', 'part_number' => 'TIR-7090-017', 'brand' => 'Universal', 'category' => 'Tires', 'price' => '₱1,450', 'availability' => 'Low Stock', 'status' => 'Active', 'updated' => 'Today', 'date_value' => '2026-08-08T12:00:00'],
                ['id' => 8, 'name' => 'Honda Drive Belt', 'part_number' => 'HND-DB-032', 'brand' => 'Honda', 'category' => 'Maintenance Parts', 'price' => '₱780', 'availability' => 'Available', 'status' => 'Archived', 'updated' => 'Yesterday', 'date_value' => '2026-08-07T16:00:00'],
            ],
            'categories' => [
                ['id' => 1, 'name' => 'Brake Parts', 'products' => 14, 'status' => 'Active'],
                ['id' => 2, 'name' => 'Batteries', 'products' => 8, 'status' => 'Active'],
                ['id' => 3, 'name' => 'Maintenance Parts', 'products' => 22, 'status' => 'Active'],
                ['id' => 4, 'name' => 'Oils & Lubricants', 'products' => 12, 'status' => 'Active'],
                ['id' => 5, 'name' => 'Electrical Parts', 'products' => 16, 'status' => 'Active'],
                ['id' => 6, 'name' => 'Tires', 'products' => 14, 'status' => 'Active'],
            ],
            'brands' => [
                ['id' => 1, 'name' => 'Honda', 'products' => 21, 'status' => 'Active'],
                ['id' => 2, 'name' => 'Yamaha', 'products' => 17, 'status' => 'Active'],
                ['id' => 3, 'name' => 'Suzuki', 'products' => 12, 'status' => 'Active'],
                ['id' => 4, 'name' => 'Universal', 'products' => 36, 'status' => 'Active'],
            ],
            'motorcycle_models' => [
                ['id' => 1, 'model' => 'Honda Click 125i', 'brand' => 'Honda', 'series' => '125i Series', 'compatible_products' => 12, 'status' => 'Active'],
                ['id' => 2, 'model' => 'Yamaha Mio i125', 'brand' => 'Yamaha', 'series' => 'i125 Series', 'compatible_products' => 9, 'status' => 'Active'],
                ['id' => 3, 'model' => 'Suzuki Raider R150', 'brand' => 'Suzuki', 'series' => 'R150 Series', 'compatible_products' => 11, 'status' => 'Active'],
            ],
        ]);
    }
}
