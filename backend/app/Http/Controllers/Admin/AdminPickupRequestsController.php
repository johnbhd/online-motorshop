<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class AdminPickupRequestsController extends Controller
{
    public function index(): View
    {
        return view('admin.pickups.index');
    }

    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => ['active_pickups' => 4, 'ready_for_pickup' => 2, 'completed_today' => 6, 'total' => 22, 'preparing' => 2, 'ready' => 2, 'completed' => 16],
            'pickup_requests' => [
                ['id'=>1,'order'=>'ALD-2026-000126','customer'=>'John Doe','branch'=>'Manila','schedule'=>'Today - Flexible','amount'=>'₱3,260','payment'=>'Pay at Pickup','staff'=>'Staff User','status'=>'Preparing','date_value'=>'2026-08-08'],
                ['id'=>2,'order'=>'ALD-2026-000125','customer'=>'Paolo Santos','branch'=>'Manila','schedule'=>'Today - 4:00 PM','amount'=>'₱920','payment'=>'Paid','staff'=>'Anna Staff','status'=>'Ready for Pickup','date_value'=>'2026-08-08'],
                ['id'=>3,'order'=>'ALD-2026-000118','customer'=>'Maria Cruz','branch'=>'Makati','schedule'=>'Today - Flexible','amount'=>'₱1,850','payment'=>'Paid','staff'=>'Mark Staff','status'=>'Ready for Pickup','date_value'=>'2026-08-08'],
                ['id'=>4,'order'=>'ALD-2026-000116','customer'=>'Daniel Reyes','branch'=>'Imus','schedule'=>'Tomorrow - Flexible','amount'=>'₱2,100','payment'=>'Pay at Pickup','staff'=>'Staff User','status'=>'Preparing','date_value'=>'2026-08-09'],
                ['id'=>5,'order'=>'ALD-2026-000111','customer'=>'Angela Ramos','branch'=>'Manila','schedule'=>'Aug 7, 2026','amount'=>'₱1,450','payment'=>'Paid','staff'=>'Anna Staff','status'=>'Completed','date_value'=>'2026-08-07'],
                ['id'=>6,'order'=>'ALD-2026-000109','customer'=>'Mark Lopez','branch'=>'Makati','schedule'=>'Aug 7, 2026','amount'=>'₱2,680','payment'=>'Paid','staff'=>'Mark Staff','status'=>'Completed','date_value'=>'2026-08-07'],
                ['id'=>7,'order'=>'ALD-2026-000103','customer'=>'Grace Santos','branch'=>'Imus','schedule'=>'Aug 6, 2026','amount'=>'₱780','payment'=>'Paid','staff'=>'Staff User','status'=>'Completed','date_value'=>'2026-08-06'],
                ['id'=>8,'order'=>'ALD-2026-000101','customer'=>'Miguel Cruz','branch'=>'Manila','schedule'=>'Aug 6, 2026','amount'=>'₱1,200','payment'=>'Cancelled','staff'=>'—','status'=>'Cancelled','date_value'=>'2026-08-06'],
            ],
            'branches' => [
                ['branch'=>'Manila Branch','requests'=>9,'breakdown'=>'2 Active · 7 Completed'],
                ['branch'=>'Makati Branch','requests'=>7,'breakdown'=>'1 Active · 6 Completed'],
                ['branch'=>'Imus Branch','requests'=>6,'breakdown'=>'1 Active · 5 Completed'],
            ],
        ]);
    }
}
