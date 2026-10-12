<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminCategoryIndexRequest;
use App\Http\Requests\AdminProductIndexRequest;
use App\Http\Requests\StoreAdminCategoryRequest;
use App\Http\Requests\UpdateAdminCategoryRequest;
use App\Models\Category;
use App\Services\AdminCategoryPresenter;
use App\Services\AdminCategoryService;
use App\Services\AdminProductService;
use Illuminate\Http\JsonResponse;

class AdminCategoryController extends Controller
{
    public function __construct(
        private readonly AdminCategoryPresenter $presenter,
        private readonly AdminCategoryService $service,
        private readonly AdminProductService $productService,
    ) {}

    public function index(AdminCategoryIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function show(Category $category): JsonResponse
    {
        $category = $this->service->find($category);

        return response()->json([
            'category' => $this->presenter->category($category),
        ]);
    }

    public function products(AdminProductIndexRequest $request, Category $category): JsonResponse
    {
        $category = $this->service->find($category);
        $filters = $request->validated();
        $filters['category'] = $category->name;

        return response()->json($this->productService->index($filters));
    }

    public function store(StoreAdminCategoryRequest $request): JsonResponse
    {
        $category = $this->service->create(array_merge(
            ['status' => 'active'],
            $request->validated(),
        ));

        return response()->json([
            'message' => 'Category created successfully.',
            'category' => $this->presenter->category($category),
        ], 201);
    }

    public function update(UpdateAdminCategoryRequest $request, Category $category): JsonResponse
    {
        $category = $this->service->update($category, $request->validated());

        return response()->json([
            'message' => 'Category updated successfully.',
            'category' => $this->presenter->category($category),
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        if (! $this->service->delete($category)) {
            return response()->json([
                'message' => 'Category cannot be deleted while products are assigned to it.',
            ], 409);
        }

        return response()->json([
            'message' => 'Category deleted successfully.',
        ]);
    }
}
