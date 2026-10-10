<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminBranchIndexRequest;
use App\Http\Requests\StoreAdminBranchRequest;
use App\Http\Requests\UpdateAdminBranchRequest;
use App\Models\Branch;
use App\Services\AdminBranchPresenter;
use App\Services\AdminBranchService;
use Illuminate\Http\JsonResponse;

class AdminBranchesController extends Controller
{
    public function __construct(
        private readonly AdminBranchPresenter $presenter,
        private readonly AdminBranchService $service,
    ) {}

    public function index(AdminBranchIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function data(AdminBranchIndexRequest $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(Branch $branch): JsonResponse
    {
        return response()->json([
            'branch' => $this->presenter->detail($this->service->find($branch)),
        ]);
    }

    public function store(StoreAdminBranchRequest $request): JsonResponse
    {
        $branch = $this->service->create(array_merge(
            [
                'pickup_available' => true,
                'status' => 'active',
            ],
            $request->validated(),
        ));

        return response()->json([
            'message' => 'Branch created successfully.',
            'branch' => $this->presenter->detail($branch),
        ], 201);
    }

    public function update(UpdateAdminBranchRequest $request, Branch $branch): JsonResponse
    {
        $branch = $this->service->find($branch);
        $branch = $this->service->update($branch, $request->validated());

        return response()->json([
            'message' => 'Branch updated successfully.',
            'branch' => $this->presenter->detail($branch),
        ]);
    }

    public function destroy(Branch $branch): JsonResponse
    {
        $branch = $this->service->find($branch);
        if (! $this->service->delete($branch)) {
            return response()->json([
                'message' => 'Branch cannot be deleted while staff, orders, pickup requests, or delivery requests reference it.',
            ], 409);
        }

        return response()->json([
            'message' => 'Branch deleted successfully.',
        ]);
    }
}
