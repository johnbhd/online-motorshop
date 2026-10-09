<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAdminPasswordRequest;
use App\Http\Requests\UpdateAdminProfileRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->profilePayload($request->user())]);
    }

    public function update(UpdateAdminProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated());
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->profilePayload($user->fresh()),
        ]);
    }

    public function updatePassword(UpdateAdminPasswordRequest $request): JsonResponse
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
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
