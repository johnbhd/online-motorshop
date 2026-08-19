<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffReportsController extends Controller
{
    public function data(Request $request): JsonResponse
    {
        $period = $request->string('period', 'month')->value();

        return response()->json([
            'period' => $period,
            'summary' => [
                'total_sales' => 256840,
                'total_sales_change' => 12.6,
                'total_orders' => 148,
                'total_orders_change' => 8.4,
                'total_customers' => 98,
                'total_customers_change' => 10.3,
                'average_order_value' => 1735,
                'average_order_value_change' => 5.8,
                'completed_orders' => 112,
                'completion_rate' => 75.7,
            ],
            'sales_over_time' => [
                ['label' => 'Aug 1', 'sales' => 10000], ['label' => 'Aug 3', 'sales' => 19000],
                ['label' => 'Aug 6', 'sales' => 13000], ['label' => 'Aug 8', 'sales' => 27000],
                ['label' => 'Aug 11', 'sales' => 11000], ['label' => 'Aug 14', 'sales' => 17000],
                ['label' => 'Aug 16', 'sales' => 25000], ['label' => 'Aug 18', 'sales' => 20000],
                ['label' => 'Aug 20', 'sales' => 37000], ['label' => 'Aug 22', 'sales' => 19000],
                ['label' => 'Aug 24', 'sales' => 22000], ['label' => 'Aug 27', 'sales' => 44000],
                ['label' => 'Aug 30', 'sales' => 24000],
            ],
            'orders_by_status' => [
                ['label' => 'Completed', 'value' => 45, 'color' => '#16a34a'],
                ['label' => 'Preparing', 'value' => 15, 'color' => '#3b82f6'],
                ['label' => 'Pending', 'value' => 12, 'color' => '#f97316'],
                ['label' => 'Confirmed', 'value' => 10, 'color' => '#0B1930'],
                ['label' => 'Delivery', 'value' => 8, 'color' => '#8b5cf6'],
                ['label' => 'Ready Pickup', 'value' => 6, 'color' => '#10b981'],
                ['label' => 'Cancelled', 'value' => 4, 'color' => '#ef4444'],
            ],
            'sales_by_branch' => [
                ['branch' => 'Manila Branch', 'sales' => 112300],
                ['branch' => 'Makati Branch', 'sales' => 86540],
                ['branch' => 'Imus Branch', 'sales' => 58000],
            ],
            'top_products' => [
                ['label' => 'Honda Brake Pads', 'sales' => 38400],
                ['label' => 'Yamaha Battery', 'sales' => 32750],
                ['label' => 'Tire 70/90-17', 'sales' => 27600],
                ['label' => 'Premium 4T Oil', 'sales' => 23800],
                ['label' => 'Suzuki Air Filter', 'sales' => 18900],
            ],
            'customer_breakdown' => [
                ['label' => 'Guest Customers', 'value' => 61, 'color' => '#f97316'],
                ['label' => 'Registered Customers', 'value' => 39, 'color' => '#3b82f6'],
            ],
            'sales_vs_orders' => [
                ['label' => 'Aug 1', 'sales' => 10000, 'orders' => 6], ['label' => 'Aug 5', 'sales' => 16000, 'orders' => 9],
                ['label' => 'Aug 10', 'sales' => 27000, 'orders' => 15], ['label' => 'Aug 15', 'sales' => 18000, 'orders' => 11],
                ['label' => 'Aug 20', 'sales' => 37000, 'orders' => 21], ['label' => 'Aug 25', 'sales' => 32000, 'orders' => 17],
                ['label' => 'Aug 30', 'sales' => 24000, 'orders' => 14],
            ],
            'insights' => [
                'most_ordered_product' => ['value' => 'Genuine Honda Brake Pad Set', 'supporting' => '42 orders | ₱38,400 sales'],
                'top_customer' => ['value' => 'Miguel Ramos', 'supporting' => '11 orders | ₱18,750 total order value'],
                'most_used_fulfillment' => ['value' => 'Store Pickup', 'supporting' => '62% of completed orders | 38% Lalamove Delivery'],
            ],
        ]);
    }
}
