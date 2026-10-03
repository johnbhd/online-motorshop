<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminBrandIndexRequest;
use App\Http\Requests\AdminProductIndexRequest;
use App\Http\Requests\StoreAdminBrandRequest;
use App\Http\Requests\UpdateAdminBrandRequest;
use App\Models\Brand;
use App\Services\AdminBrandPresenter;
use App\Services\AdminBrandService;
use App\Services\AdminProductService;
use Illuminate\Http\JsonResponse;

class AdminBrandController extends Controller
{
    public function __construct(
        private readonly AdminBrandPresenter $presenter,
        private readonly AdminBrandService $service,
        private readonly AdminProductService $productService,
    ) {}

    public function index(AdminBrandIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function show(Brand $brand): JsonResponse
    {
        $brand->loadCount('products');

        return response()->json([
            'brand' => $this->presenter->brand($brand),
        ]);
    }

    public function products(AdminProductIndexRequest $request, Brand $brand): JsonResponse
    {
        $filters = $request->validated();
        $filters['brand'] = $brand->name;

        return response()->json($this->productService->index($filters));
    }

    public function store(StoreAdminBrandRequest $request): JsonResponse
    {
        $brand = $this->service->create(array_merge(
            ['status' => 'active'],
            $request->validated(),
        ));

        return response()->json([
            'message' => 'Brand created successfully.',
            'brand' => $this->presenter->brand($brand),
        ], 201);
    }

    public function update(UpdateAdminBrandRequest $request, Brand $brand): JsonResponse
    {
        $brand = $this->service->update($brand, $request->validated());

        return response()->json([
            'message' => 'Brand updated successfully.',
            'brand' => $this->presenter->brand($brand),
        ]);
    }

    public function destroy(Brand $brand): JsonResponse
    {
        if (! $this->service->delete($brand)) {
            return response()->json([
                'message' => 'Brand cannot be deleted while products are assigned to it.',
            ], 409);
        }

        return response()->json([
            'message' => 'Brand deleted successfully.',
        ]);
    }
}
