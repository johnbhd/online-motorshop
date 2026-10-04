<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminDashboardService;
use App\Services\OrderRequestPresenter;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __construct(
        private readonly AdminDashboardService $dashboardService,
        private readonly OrderRequestPresenter $orderRequestPresenter,
    ) {}

    public function data(): JsonResponse
    {
        return response()->json([
            'summary' => $this->dashboardService->summary(),
            'branches' => $this->dashboardService->branches()->values()->all(),
            'recent_orders' => $this->dashboardService
                ->recentOrders()
                ->map(fn ($order): array => $this->orderRequestPresenter->staffSummary($order))
                ->values()
                ->all(),
        ]);
    }
}
