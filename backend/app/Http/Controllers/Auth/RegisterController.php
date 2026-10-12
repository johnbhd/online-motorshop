<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\AuthResponseService;
use App\Services\CustomerNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class RegisterController extends Controller
{
    public function __construct(
        private readonly CustomerNotificationService $customerNotificationService,
        private readonly AuthResponseService $authResponseService,
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

            return [
                'user' => $user->load('customer'),
            ];
        });

        $this->customerNotificationService->customerSignedIn($result['user']);

        return response()->json(
            $this->authResponseService->issueToken($result['user'], 'Registration successful'),
            201,
        );
    }
}
