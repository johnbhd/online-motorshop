<?php

use App\Http\Controllers\Admin\AdminBranchesController;
use App\Http\Controllers\Admin\AdminCustomersController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminDeliveryRequestsController;
use App\Http\Controllers\Admin\AdminMessagesController;
use App\Http\Controllers\Admin\AdminOrdersController;
use App\Http\Controllers\Admin\AdminPaymentsController;
use App\Http\Controllers\Admin\AdminPickupRequestsController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminStaffController;
use App\Http\Controllers\Admin\AdminWebsiteContentController;
use App\Http\Controllers\Staff\StaffCustomersController;
use App\Http\Controllers\Staff\StaffDashboardController;
use App\Http\Controllers\Staff\StaffDeliveryRequestsController;
use App\Http\Controllers\Staff\StaffMessagesController;
use App\Http\Controllers\Staff\StaffNotificationsController;
use App\Http\Controllers\Staff\StaffOrdersController;
use App\Http\Controllers\Staff\StaffPaymentsController;
use App\Http\Controllers\Staff\StaffPickupRequestsController;
use App\Http\Controllers\Staff\StaffProductsController;
use App\Http\Controllers\Staff\StaffReportsController;
use App\Http\Controllers\Staff\StaffReviewsController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard/data', [AdminDashboardController::class, 'data'])
            ->name('dashboard.data');

        Route::get('/products/data', [AdminProductController::class, 'data'])
            ->name('products.data');

        Route::get('/orders/data', [AdminOrdersController::class, 'data'])
            ->name('orders.data');

        Route::get('/payments/data', [AdminPaymentsController::class, 'data'])
            ->name('payments.data');

        Route::get('/pickup-requests/data', [AdminPickupRequestsController::class, 'data'])
            ->name('pickups.data');

        Route::get('/delivery-requests/data', [AdminDeliveryRequestsController::class, 'data'])
            ->name('deliveries.data');

        Route::get('/customers/data', [AdminCustomersController::class, 'data'])
            ->name('customers.data');

        Route::get('/messages/data', [AdminMessagesController::class, 'data'])
            ->name('messages.data');

        Route::get('/branches/data', [AdminBranchesController::class, 'data'])
            ->name('branches.data');

        Route::get('/staff-management/data', [AdminStaffController::class, 'data'])
            ->name('staff.data');

        Route::get('/website-content/data', [AdminWebsiteContentController::class, 'data'])
            ->name('website-content.data');
    });

Route::prefix('staff')
    ->name('staff.')
    ->group(function () {
        Route::get('/dashboard/data', [StaffDashboardController::class, 'data'])
            ->name('dashboard.data');

        Route::get('/orders/data', [StaffOrdersController::class, 'data'])
            ->name('orders.data');

        Route::get('/payments/data', [StaffPaymentsController::class, 'data'])
            ->name('payments.data');

        Route::get('/pickup-requests/data', [StaffPickupRequestsController::class, 'data'])
            ->name('pickup-requests.data');

        Route::get('/delivery-requests/data', [StaffDeliveryRequestsController::class, 'data'])
            ->name('delivery-requests.data');

        Route::get('/products/data', [StaffProductsController::class, 'data'])
            ->name('products.data');

        Route::get('/messages/data', [StaffMessagesController::class, 'data'])
            ->name('messages.data');

        Route::get('/notifications/data', [StaffNotificationsController::class, 'data'])
            ->name('notifications.data');

        Route::get('/customers/data', [StaffCustomersController::class, 'data'])
            ->name('customers.data');

        Route::get('/reports/data', [StaffReportsController::class, 'data'])
            ->name('reports.data');

        Route::get('/reviews/data', [StaffReviewsController::class, 'data'])
            ->name('reviews.data');
    });
    
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'ALD Motorshop API is connected',
    ]);
});