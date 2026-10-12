<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\CustomerNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RegisterController extends Controller
{
    public function __construct(
        private readonly CustomerNotificationService $customerNotificationService,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $result = DB::transaction(function () use ($validated): array {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'branch_id' => null,
                'status' => 'active',
                'role' => 'customer',
            ]);

            $user->customer()->create([
                'full_name' => $validated['name'],
                'contact_number' => $validated['phone'],
                'email' => $validated['email'],
            ]);

            $token = $user->createToken('auth-token')->plainTextToken;

            return [
                'token' => $token,
                'user' => $user->load('customer'),
            ];
        });

        $this->customerNotificationService->customerSignedIn($result['user']);

        return response()->json([
            'message' => 'Registration successful',
            'token' => $result['token'],
            'token_type' => 'Bearer',
            'user' => [
                'id' => $result['user']->id,
                'name' => $result['user']->name,
                'email' => $result['user']->email,
                'role' => $result['user']->role,
                'status' => $result['user']->status,
                'customer' => [
                    'id' => $result['user']->customer->id,
                    'full_name' => $result['user']->customer->full_name,
                    'contact_number' => $result['user']->customer->contact_number,
                    'email' => $result['user']->customer->email,
                    'address' => $result['user']->customer->address,
                    'city_municipality_code' => $result['user']->customer->city_municipality_code,
                    'barangay_code' => $result['user']->customer->barangay_code,
                    'city' => $result['user']->customer->city,
                    'barangay' => $result['user']->customer->barangay,
                ],
            ],
        ], 201);
    }
}
