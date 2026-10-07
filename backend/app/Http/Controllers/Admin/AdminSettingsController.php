<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAdminPaymentSettingsRequest;
use App\Services\AdminPaymentSettingsService;
use Illuminate\Http\JsonResponse;

class AdminSettingsController extends Controller
{
    public function __construct(private readonly AdminPaymentSettingsService $service) {}

    public function show(): JsonResponse
    {
        return response()->json(['settings' => $this->service->show()]);
    }

    public function update(UpdateAdminPaymentSettingsRequest $request): JsonResponse
    {
        return response()->json([
            'message' => 'Payment settings updated successfully.',
            'settings' => $this->service->update(
                $request->validated(),
                $request->file('qr_image'),
            ),
        ]);
    }
}
