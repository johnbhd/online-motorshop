<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\AuthResponseService;
use App\Services\CustomerNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

class LoginController extends Controller
{
    public function __construct(
        private readonly CustomerNotificationService $customerNotificationService,
        private readonly AuthResponseService $authResponseService,
    ) {}

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->with('customer')
            ->where('email', $validated['email'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['These credentials do not match our records.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['This account is not active.'],
            ]);
        }

        $this->customerNotificationService->customerSignedIn($user);

        return response()->json($this->authResponseService->issueToken($user, 'Login successful'));
    }

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->status !== 'active') {
            return response()->json([
                'message' => 'Account is not active.',
            ], 401);
        }

        return response()->json([
            'user' => $this->authResponseService->userData($user),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $plainTextToken = $request->bearerToken();

        if (is_string($plainTextToken) && $plainTextToken !== '') {
            PersonalAccessToken::findToken($plainTextToken)?->delete();
        }

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }
}
