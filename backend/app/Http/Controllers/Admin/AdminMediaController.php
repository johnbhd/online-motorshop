<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminMediaIndexRequest;
use App\Models\MediaAsset;
use App\Services\MediaAssetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMediaController extends Controller
{
    public function __construct(private readonly MediaAssetService $service) {}

    public function index(AdminMediaIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function show(MediaAsset $mediaAsset): JsonResponse
    {
        return response()->json($this->service->show($mediaAsset));
    }

    public function destroy(Request $request, MediaAsset $mediaAsset): JsonResponse
    {
        $mediaAsset = $this->service->deleteOrphaned($mediaAsset, $request->user());

        return response()->json([
            'message' => 'Media asset deleted permanently.',
            'media' => $this->service->show($mediaAsset)['media'],
        ]);
    }

    public function retryCleanup(Request $request, MediaAsset $mediaAsset): JsonResponse
    {
        $mediaAsset = $this->service->retryCleanup($mediaAsset, $request->user());

        return response()->json([
            'message' => 'Media cleanup completed.',
            'media' => $this->service->show($mediaAsset)['media'],
        ]);
    }
}
