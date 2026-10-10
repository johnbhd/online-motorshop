<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminProductIndexRequest;
use App\Http\Requests\StoreAdminProductRequest;
use App\Http\Requests\UpdateAdminProductRequest;
use App\Services\AdminProductPresenter;
use App\Services\AdminProductService;
use App\Services\CloudinaryServiceException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        try {
            $product = $this->service->create($request->validated(), $request->user());
        } catch (CloudinaryServiceException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 503);
        }

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

        try {
            $product = $this->service->update($product, $request->validated(), $request->user());
        } catch (CloudinaryServiceException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 503);
        }

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $this->presenter->product($product),
        ]);
    }

    public function destroy(Request $request, string $partNumber): JsonResponse
    {
        $product = $this->service->findByPartNumber($partNumber);

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        if (! $this->service->delete($product, $request->user())) {
            return response()->json([
                'message' => 'Product cannot be deleted because it is referenced by an existing order.',
            ], 409);
        }

        return response()->json([
            'message' => 'Product deleted successfully.',
        ]);
    }
}
