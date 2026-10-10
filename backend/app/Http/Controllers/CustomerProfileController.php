<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateCustomerPasswordRequest;
use App\Http\Requests\UpdateCustomerProfileRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('customer');

        return response()->json(['user' => $this->profilePayload($user)]);
    }

    public function update(UpdateCustomerProfileRequest $request): JsonResponse
    {
        $user = $request->user()->loadMissing('customer');
        $customer = $user->customer;

        if (! $customer) {
            return response()->json([
                'message' => 'Customer profile not found.',
                'errors' => ['customer' => ['The authenticated customer profile is missing.']],
            ], 422);
        }

        $validated = $request->validated();

        DB::transaction(function () use ($user, $customer, $validated): void {
            $user->fill([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);
            $user->save();

            $customer->fill([
                'full_name' => $validated['name'],
                'email' => $validated['email'],
                'contact_number' => $validated['contact_number'],
                'address' => $validated['address'] ?? null,
            ]);
            $customer->save();
        });

        $user->load('customer');

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->profilePayload($user),
        ]);
    }

    public function updatePassword(UpdateCustomerPasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()?->getKey();

        DB::transaction(function () use ($user, $request, $currentTokenId): void {
            $user->forceFill(['password' => $request->validated('password')])->save();

            $tokens = $user->tokens();

            if ($currentTokenId !== null) {
                $tokens->where('id', '!=', $currentTokenId);
            }

            $tokens->delete();
        });

        return response()->json([
            'message' => 'Password updated successfully. Other active sessions have been signed out.',
        ]);
    }

    private function profilePayload(User $user): array
    {
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
            ]),
        ];
    }
}
