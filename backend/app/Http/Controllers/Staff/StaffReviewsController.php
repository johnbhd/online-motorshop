<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class StaffReviewsController extends Controller
{
    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 86,
                'average_rating' => 4.6,
                'awaiting_reply' => 7,
                'needs_admin_review' => 3,
                'published' => 68,
                'pending_review' => 8,
                'flagged' => 3,
                'hidden' => 7,
            ],
            'reviews' => [
                ['id' => 1, 'customer' => 'Mark Reyes', 'initials' => 'MR', 'product' => 'Genuine Honda Brake Pad Set', 'rating' => 5, 'review' => 'Good quality and sakto sa Honda Click ko. Easy pickup din.', 'branch' => 'Makati', 'status' => 'Published', 'date' => 'Aug 12, 2026', 'date_value' => '2026-08-12', 'action' => 'View Review'],
                ['id' => 2, 'customer' => 'Angela Cruz', 'initials' => 'AC', 'product' => 'Yamaha Motorcycle Battery', 'rating' => 4, 'review' => 'Battery works well. Staff replied quickly to my questions.', 'branch' => 'Makati', 'status' => 'Published', 'date' => 'Aug 12, 2026', 'date_value' => '2026-08-12', 'action' => 'Reply'],
                ['id' => 3, 'customer' => 'Paolo Santos', 'initials' => 'PS', 'product' => 'Motorcycle Tire 70/90-17', 'rating' => 5, 'review' => 'Smooth transaction and mabilis yung pickup process.', 'branch' => 'Manila', 'status' => 'Published', 'date' => 'Aug 11, 2026', 'date_value' => '2026-08-11', 'action' => 'View Review'],
                ['id' => 4, 'customer' => 'Carla Mendoza', 'initials' => 'CM', 'product' => 'Suzuki Air Filter', 'rating' => 2, 'review' => 'Packaging arrived damaged although the item still works.', 'branch' => 'Makati', 'status' => 'Flagged', 'date' => 'Aug 11, 2026', 'date_value' => '2026-08-11', 'action' => 'View Review'],
                ['id' => 5, 'customer' => 'Miguel Ramos', 'initials' => 'MR', 'product' => 'Premium 4T Motorcycle Engine Oil', 'rating' => 5, 'review' => 'Original item and mabilis ang transaction.', 'branch' => 'Imus', 'status' => 'Published', 'date' => 'Aug 10, 2026', 'date_value' => '2026-08-10', 'action' => 'Reply'],
                ['id' => 6, 'customer' => 'Grace Lopez', 'initials' => 'GL', 'product' => 'Front Brake Disc Rotor', 'rating' => 3, 'review' => 'Okay naman but I had to wait longer for confirmation.', 'branch' => 'Imus', 'status' => 'Pending Review', 'date' => 'Aug 9, 2026', 'date_value' => '2026-08-09', 'action' => 'View Review'],
                ['id' => 7, 'customer' => 'Daniel Reyes', 'initials' => 'DR', 'product' => 'Motorcycle Spark Plug', 'rating' => 1, 'review' => 'SPAM LINK FREE MONEY CLICK HERE', 'branch' => 'Manila', 'status' => 'Flagged', 'date' => 'Aug 8, 2026', 'date_value' => '2026-08-08', 'action' => 'Review Flag'],
                ['id' => 8, 'customer' => 'Maria Santos', 'initials' => 'MS', 'product' => 'Honda Drive Belt', 'rating' => 4, 'review' => 'Good product and friendly staff.', 'branch' => 'Manila', 'status' => 'Published', 'date' => 'Aug 7, 2026', 'date_value' => '2026-08-07', 'action' => 'Reply'],
            ],
        ]);
    }
}
