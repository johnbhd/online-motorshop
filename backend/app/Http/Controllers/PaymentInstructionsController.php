<?php

namespace App\Http\Controllers;

use App\Services\AdminPaymentSettingsService;
use Illuminate\Http\JsonResponse;

class PaymentInstructionsController extends Controller
{
    public function __construct(private readonly AdminPaymentSettingsService $service) {}

    public function show(): JsonResponse
    {
        return response()->json($this->service->publicInstructions());
    }
}
