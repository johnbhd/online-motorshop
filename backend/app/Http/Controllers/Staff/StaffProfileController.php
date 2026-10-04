<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateStaffProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json($this->profileResponse($request));
    }

    public function update(UpdateStaffProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated());
        $user->save();
        $user->load('branch:id,name');

        return response()->json($this->profileResponse($request));
    }

    private function profileResponse(Request $request): array
    {
        $user = $request->user()->loadMissing('branch:id,name');

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => $user->status,
                'created_at' => $user->created_at?->toISOString(),
            ],
            'branch' => $user->branch?->only(['id', 'name']),
        ];
    }
}
