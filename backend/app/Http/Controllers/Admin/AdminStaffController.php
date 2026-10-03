<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminStaffIndexRequest;
use App\Http\Requests\StoreAdminStaffRequest;
use App\Http\Requests\UpdateAdminStaffPasswordRequest;
use App\Http\Requests\UpdateAdminStaffRequest;
use App\Models\User;
use App\Services\AdminStaffPresenter;
use App\Services\AdminStaffService;
use Illuminate\Http\JsonResponse;

class AdminStaffController extends Controller
{
    public function __construct(
        private readonly AdminStaffPresenter $presenter,
        private readonly AdminStaffService $service,
    ) {}

    public function index(AdminStaffIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function data(AdminStaffIndexRequest $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(User $staff): JsonResponse
    {
        return response()->json([
            'staff' => $this->presenter->staff($this->service->find($staff)),
        ]);
    }

    public function store(StoreAdminStaffRequest $request): JsonResponse
    {
        $staff = $this->service->create($request->validated());

        return response()->json([
            'message' => 'Staff account created successfully.',
            'staff' => $this->presenter->staff($staff),
        ], 201);
    }

    public function update(UpdateAdminStaffRequest $request, User $staff): JsonResponse
    {
        $staff = $this->service->update($staff, $request->validated());

        return response()->json([
            'message' => 'Staff account updated successfully.',
            'staff' => $this->presenter->staff($staff),
        ]);
    }

    public function updatePassword(
        UpdateAdminStaffPasswordRequest $request,
        User $staff,
    ): JsonResponse {
        $staff = $this->service->updatePassword($staff, $request->validated()['password']);

        return response()->json([
            'message' => 'Staff password updated successfully. Sign in again with the new password.',
            'staff' => $this->presenter->staff($staff),
        ]);
    }

    public function destroy(User $staff): JsonResponse
    {
        if (! $this->service->delete($staff)) {
            return response()->json([
                'message' => 'Staff account cannot be deleted while it is referenced by operational or historical records. Set the account to inactive instead.',
            ], 409);
        }

        return response()->json([
            'message' => 'Staff account deleted successfully.',
        ]);
    }
}
