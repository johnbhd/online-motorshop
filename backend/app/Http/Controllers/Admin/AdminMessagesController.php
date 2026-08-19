<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class AdminMessagesController extends Controller
{
    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 24,
                'unread' => 5,
            ],
            'conversations' => [
                [
                    'id' => 1,
                    'customer' => [
                        'name' => 'Mark Reyes',
                        'initials' => 'MR',
                    ],
                    'branch' => 'Makati Branch',
                    'status' => 'New',
                    'unread' => true,
                    'last_message' => 'Available ba yung Honda Click brake pad sa Makati branch?',
                    'updated_at' => '12 min ago',
                    'messages' => [
                        [
                            'sender' => 'customer',
                            'message' => 'Available ba yung Honda Click brake pad sa Makati branch?',
                            'time' => '12:03 PM',
                        ],
                        [
                            'sender' => 'admin',
                            'message' => 'Hi! We can confirm that the Honda Click brake pad is currently available at our Makati Branch.',
                            'time' => '12:10 PM',
                        ],
                        [
                            'sender' => 'customer',
                            'message' => 'Okay po, thank you!',
                            'time' => '12:12 PM',
                        ],
                    ],
                ],
                [
                    'id' => 2,
                    'customer' => [
                        'name' => 'Angela Cruz',
                        'initials' => 'AC',
                    ],
                    'branch' => 'Makati Branch',
                    'status' => 'Open',
                    'unread' => true,
                    'last_message' => 'Pwede po ba Lalamove delivery to Makati?',
                    'updated_at' => '31 min ago',
                    'messages' => [
                        [
                            'sender' => 'customer',
                            'message' => 'Pwede po ba Lalamove delivery to Makati?',
                            'time' => '11:28 AM',
                        ],
                        [
                            'sender' => 'admin',
                            'message' => 'Yes po, we can arrange Lalamove delivery for your order.',
                            'time' => '11:32 AM',
                        ],
                    ],
                ],
                [
                    'id' => 3,
                    'customer' => [
                        'name' => 'Paolo Santos',
                        'initials' => 'PS',
                    ],
                    'branch' => 'Manila Branch',
                    'status' => 'Waiting',
                    'unread' => false,
                    'last_message' => 'Ready na po ba pickup order ko?',
                    'updated_at' => '1 hr ago',
                    'messages' => [
                        [
                            'sender' => 'customer',
                            'message' => 'Ready na po ba pickup order ko?',
                            'time' => '10:41 AM',
                        ],
                        [
                            'sender' => 'admin',
                            'message' => 'We are confirming this with the branch and will update you shortly.',
                            'time' => '10:45 AM',
                        ],
                    ],
                ],
                [
                    'id' => 4,
                    'customer' => [
                        'name' => 'Carla Mendoza',
                        'initials' => 'CM',
                    ],
                    'branch' => 'Makati Branch',
                    'status' => 'Open',
                    'unread' => false,
                    'last_message' => 'I already uploaded my payment proof.',
                    'updated_at' => '2 hrs ago',
                    'messages' => [
                        [
                            'sender' => 'customer',
                            'message' => 'I already uploaded my payment proof.',
                            'time' => '9:20 AM',
                        ],
                        [
                            'sender' => 'admin',
                            'message' => 'Thank you. We will verify it shortly.',
                            'time' => '9:24 AM',
                        ],
                    ],
                ],
                [
                    'id' => 5,
                    'customer' => [
                        'name' => 'Miguel Ramos',
                        'initials' => 'MR',
                    ],
                    'branch' => 'Imus Branch',
                    'status' => 'New',
                    'unread' => true,
                    'last_message' => 'Compatible ba ito sa Suzuki Raider R150?',
                    'updated_at' => 'Today',
                    'messages' => [
                        [
                            'sender' => 'customer',
                            'message' => 'Compatible ba ito sa Suzuki Raider R150?',
                            'time' => '8:55 AM',
                        ],
                    ],
                ],
                [
                    'id' => 6,
                    'customer' => [
                        'name' => 'Grace Lopez',
                        'initials' => 'GL',
                    ],
                    'branch' => 'Imus Branch',
                    'status' => 'Resolved',
                    'unread' => false,
                    'last_message' => 'Thank you, received na po.',
                    'updated_at' => 'Yesterday',
                    'messages' => [
                        [
                            'sender' => 'admin',
                            'message' => 'Your order has been completed. Thank you!',
                            'time' => '4:05 PM',
                        ],
                        [
                            'sender' => 'customer',
                            'message' => 'Thank you, received na po.',
                            'time' => '4:12 PM',
                        ],
                    ],
                ],
            ],
        ]);
    }
}
