<?php

namespace App\Services;

use App\Models\User;

class AdminStaffPresenter
{
    public function staff(User $staff): array
    {
        return [
            'id' => $staff->id,
            'name' => $staff->name,
            'email' => $staff->email,
            'role' => $staff->role,
            'status' => $staff->status,
            'branch' => $staff->branch?->only(['id', 'name']),
            'orders_handled' => $staff->orders_handled_count ?? $staff->assignedOrders()->count(),
            'payments_verified' => $staff->payments_verified_count ?? $staff->verifiedPayments()->count(),
            'pickup_requests_handled' => $staff->pickup_requests_count ?? $staff->assignedPickupRequests()->count(),
            'delivery_requests_handled' => $staff->delivery_requests_count ?? $staff->assignedDeliveryRequests()->count(),
            'messages_sent' => $staff->messages_sent_count ?? $staff->sentMessages()->count(),
            'created_at' => $staff->created_at?->toISOString(),
            'updated_at' => $staff->updated_at?->toISOString(),
        ];
    }
}
