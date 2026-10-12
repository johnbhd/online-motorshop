<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAdminPaymentSettingsRequest;
use App\Services\AdminPaymentSettingsService;
use App\Services\CloudinaryServiceException;
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
        try {
            $settings = $this->service->update(
                $request->validated(),
                $request->file('qr_image'),
                $request->user(),
            );
        } catch (CloudinaryServiceException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 503);
        }

        return response()->json([
            'message' => 'Payment settings updated successfully.',
            'settings' => $settings,
        ]);
    }
}
