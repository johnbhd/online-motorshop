<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminArchiveIndexRequest;
use App\Services\AdminArchiveService;
use Illuminate\Http\JsonResponse;

class AdminArchiveController extends Controller
{
    public function __construct(private readonly AdminArchiveService $service) {}

    public function index(AdminArchiveIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function store(string $type, string $record): JsonResponse
    {
        return response()->json([
            'message' => 'Record archived successfully.',
            'archive' => $this->service->archive($type, $this->recordId($record), $this->user()),
        ], 201);
    }

    public function restore(string $type, string $record): JsonResponse
    {
        return response()->json([
            'message' => 'Record restored successfully.',
            'archive' => $this->service->restore($type, $this->recordId($record)),
        ]);
    }

    public function destroy(string $type, string $record): JsonResponse
    {
        return response()->json([
            'message' => 'Record permanently deleted.',
            'archive' => $this->service->permanentlyDelete($type, $this->recordId($record)),
        ]);
    }

    private function recordId(string $record): int
    {
        abort_unless(ctype_digit($record) && (int) $record > 0, 404, 'Archived record not found.');

        return (int) $record;
    }

    private function user()
    {
        return request()->user();
    }
}
