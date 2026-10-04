<?php

namespace App\Services;

use App\Models\Branch;

class AdminBranchPresenter
{
    public function branch(Branch $branch): array
    {
        return [
            'id' => $branch->id,
            'name' => $branch->name,
            'address' => $branch->address,
            'contact_number' => $branch->contact_number,
            'pickup_available' => (bool) $branch->pickup_available,
            'status' => $branch->status,
            'staff_count' => $branch->staff_count ?? $branch->users()->where('role', 'staff')->count(),
            'active_staff_count' => $branch->active_staff_count ?? $branch->users()->where('role', 'staff')->where('status', 'active')->count(),
            'order_count' => $branch->order_count ?? $branch->orderRequests()->count(),
            'pickup_count' => $branch->pickup_count ?? $branch->pickupRequests()->count(),
            'delivery_count' => $branch->delivery_count ?? $branch->deliveryRequests()->count(),
            'created_at' => $branch->created_at?->toISOString(),
            'updated_at' => $branch->updated_at?->toISOString(),
        ];
    }

    public function detail(Branch $branch): array
    {
        return array_merge($this->branch($branch), [
            'staff' => $branch->relationLoaded('users')
                ? $branch->users->map(fn ($user): array => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                ])->values()->all()
                : [],
        ]);
    }
}
