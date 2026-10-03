<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminProductIndexRequest;
use App\Http\Requests\StoreAdminProductRequest;
use App\Http\Requests\UpdateAdminProductRequest;
use App\Services\AdminProductPresenter;
use App\Services\AdminProductService;
use Illuminate\Http\JsonResponse;

class AdminProductController extends Controller
{
    public function __construct(
        private readonly AdminProductPresenter $presenter,
        private readonly AdminProductService $service,
    ) {}

    public function index(AdminProductIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function data(AdminProductIndexRequest $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(string $partNumber): JsonResponse
    {
        $product = $this->service->findByPartNumber($partNumber);

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        return response()->json([
            'product' => $this->presenter->product($product),
        ]);
    }

    public function store(StoreAdminProductRequest $request): JsonResponse
    {
        $product = $this->service->create($request->validated());

        return response()->json([
            'message' => 'Product created successfully.',
            'product' => $this->presenter->product($product),
        ], 201);
    }

    public function update(UpdateAdminProductRequest $request, string $partNumber): JsonResponse
    {
        $product = $this->service->findByPartNumber($partNumber);

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        $product = $this->service->update($product, $request->validated());

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $this->presenter->product($product),
        ]);
    }

    public function destroy(string $partNumber): JsonResponse
    {
        $product = $this->service->findByPartNumber($partNumber);

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        if (! $this->service->delete($product)) {
            return response()->json([
                'message' => 'Product cannot be deleted because it is referenced by an existing order.',
            ], 409);
        }

        return response()->json([
            'message' => 'Product deleted successfully.',
        ]);
    }
}
