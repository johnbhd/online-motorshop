<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class AdminWebsiteContentController extends Controller
{
    public function index(): View
    {
        return view('admin.website-content.index');
    }

    public function data(): JsonResponse
    {
        return response()->json([
            'homepage' => [
                'hero' => [
                    'small_label' => 'GENUINE MOTORCYCLE PARTS',
                    'heading' => 'RIDE READY WITH THE RIGHT PARTS',
                    'supporting_text' => 'Browse genuine Honda, Yamaha, and Suzuki motorcycle parts. Submit your order online and choose store pickup or Lalamove delivery.',
                    'primary_button' => 'Shop Motorcycle Parts',
                    'secondary_button' => 'Track Your Order',
                    'image_url' => null,
                ],
                'sections' => [
                    'brands' => true,
                    'categories' => true,
                    'featured_products' => true,
                    'how_ordering_works' => true,
                    'pickup_delivery' => true,
                    'customer_reviews' => true,
                    'branch_locations' => true,
                ],
                'cta' => [
                    'heading' => 'Need Motorcycle Parts?',
                    'supporting_text' => 'Browse ALD products or send us an inquiry for assistance.',
                    'button_text' => 'Browse Products',
                ],
            ],
        ]);
    }
}
