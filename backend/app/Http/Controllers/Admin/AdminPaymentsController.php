<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class AdminPaymentsController extends Controller
{
    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => [
                'total' => 41,
                'paid' => 36,
                'waiting_for_verification' => 3,
                'failed_refunded' => 2,
            ],
            'payments' => [
                ['id' => 1, 'order' => 'ALD-2026-000127', 'customer' => 'Angela Cruz', 'branch' => 'Makati', 'order_total' => '₱3,400', 'method' => 'Online Payment', 'amount_paid' => '₱3,400', 'status' => 'Waiting for Verification', 'verified_by' => '—', 'payment_date' => 'Aug 8, 2026', 'date_value' => '2026-08-08', 'payment_reference' => 'PAY-2026-0808-127', 'action' => 'Review'],
                ['id' => 2, 'order' => 'ALD-2026-000124', 'customer' => 'Carla Mendoza', 'branch' => 'Makati', 'order_total' => '₱2,470', 'method' => 'Online Payment', 'amount_paid' => '₱2,470', 'status' => 'Paid', 'verified_by' => 'Staff User', 'payment_date' => 'Aug 8, 2026', 'date_value' => '2026-08-08', 'payment_reference' => 'PAY-2026-0808-124', 'action' => 'View'],
                ['id' => 3, 'order' => 'ALD-2026-000126', 'customer' => 'John Doe', 'branch' => 'Manila', 'order_total' => '₱3,260', 'method' => 'Cash / Pay at Branch', 'amount_paid' => '—', 'status' => 'Unpaid', 'verified_by' => '—', 'payment_date' => '—', 'date_value' => '2026-08-08', 'payment_reference' => null, 'action' => 'View'],
                ['id' => 4, 'order' => 'ALD-2026-000125', 'customer' => 'Paolo Santos', 'branch' => 'Manila', 'order_total' => '₱920', 'method' => 'Cash / Pay at Branch', 'amount_paid' => '—', 'status' => 'Waiting for Payment', 'verified_by' => '—', 'payment_date' => '—', 'date_value' => '2026-08-08', 'payment_reference' => null, 'action' => 'View'],
                ['id' => 5, 'order' => 'ALD-2026-000123', 'customer' => 'Miguel Ramos', 'branch' => 'Manila', 'order_total' => '₱3,440', 'method' => 'Online Payment', 'amount_paid' => '₱3,440', 'status' => 'Paid', 'verified_by' => 'Anna Staff', 'payment_date' => 'Aug 7, 2026', 'date_value' => '2026-08-07', 'payment_reference' => 'PAY-2026-0807-123', 'action' => 'View'],
                ['id' => 6, 'order' => 'ALD-2026-000120', 'customer' => 'Grace Lopez', 'branch' => 'Imus', 'order_total' => '₱1,250', 'method' => 'Online Payment', 'amount_paid' => '₱1,250', 'status' => 'Failed', 'verified_by' => 'Mark Staff', 'payment_date' => 'Aug 7, 2026', 'date_value' => '2026-08-07', 'payment_reference' => 'PAY-2026-0807-120', 'action' => 'Review'],
                ['id' => 7, 'order' => 'ALD-2026-000117', 'customer' => 'Daniel Reyes', 'branch' => 'Manila', 'order_total' => '₱2,800', 'method' => 'Online Payment', 'amount_paid' => '₱2,800', 'status' => 'Refunded', 'verified_by' => 'Admin User', 'payment_date' => 'Aug 6, 2026', 'date_value' => '2026-08-06', 'payment_reference' => 'PAY-2026-0806-117', 'action' => 'View'],
                ['id' => 8, 'order' => 'ALD-2026-000115', 'customer' => 'Maria Santos', 'branch' => 'Makati', 'order_total' => '₱750', 'method' => 'Cash / Pay at Branch', 'amount_paid' => '—', 'status' => 'Cancelled', 'verified_by' => '—', 'payment_date' => '—', 'date_value' => '2026-08-06', 'payment_reference' => null, 'action' => 'View'],
            ],
        ]);
    }
}
