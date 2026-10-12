<?php

namespace App\Services\Auth;

use App\Models\User;

class AuthResponseService
{
    public function issueToken(User $user, string $message): array
    {
        return [
            'message' => $message,
            'token' => $user->createToken('auth-token')->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $this->userData($user),
        ];
    }

    public function userData(User $user): array
    {
        $user->loadMissing('customer');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'customer' => $user->customer?->only([
                'id',
                'full_name',
                'contact_number',
                'email',
                'address',
                'city_municipality_code',
                'barangay_code',
                'city',
                'barangay',
                'latitude',
                'longitude',
            ]),
        ];
    }
}
