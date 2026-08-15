<?php

use App\Http\Controllers\Staff\StaffDashboardController;
use App\Http\Controllers\Staff\StaffCustomersController;
use App\Http\Controllers\Staff\StaffDeliveryRequestsController;
use App\Http\Controllers\Staff\StaffMessagesController;
use App\Http\Controllers\Staff\StaffNotificationsController;
use App\Http\Controllers\Staff\StaffOrdersController;
use App\Http\Controllers\Staff\StaffPaymentsController;
use App\Http\Controllers\Staff\StaffPickupRequestsController;
use App\Http\Controllers\Staff\StaffProductsController;
use App\Http\Controllers\Staff\StaffReportsController;
use App\Http\Controllers\Staff\StaffReviewsController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\Admin\AdminOrdersController;
use App\Http\Controllers\Admin\AdminPaymentsController;
use App\Http\Controllers\Admin\AdminPickupRequestsController;
use App\Http\Controllers\Admin\AdminDeliveryRequestsController;
use App\Http\Controllers\Admin\AdminCustomersController;
use App\Http\Controllers\Admin\AdminMessagesController;
use App\Http\Controllers\Admin\AdminBranchesController;
use App\Http\Controllers\Admin\AdminStaffController;
use App\Http\Controllers\Admin\AdminWebsiteContentController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('public.home');
})->name('home');

Route::prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', [AdminDashboardController::class, 'index'])
            ->name('dashboard');

        Route::get('/dashboard/data', [AdminDashboardController::class, 'data'])
            ->name('dashboard.data');

        Route::get('/products', [AdminProductController::class, 'index'])
            ->name('products.index');

        Route::get('/products/data', [AdminProductController::class, 'data'])
            ->name('products.data');

        Route::get('/orders', [AdminOrdersController::class, 'index'])
            ->name('orders.index');

        Route::get('/orders/data', [AdminOrdersController::class, 'data'])
            ->name('orders.data');

        Route::get('/payments', [AdminPaymentsController::class, 'index'])
            ->name('payments.index');

        Route::get('/payments/data', [AdminPaymentsController::class, 'data'])
            ->name('payments.data');

        Route::get('/pickup-requests', [AdminPickupRequestsController::class, 'index'])
            ->name('pickups.index');

        Route::get('/pickup-requests/data', [AdminPickupRequestsController::class, 'data'])
            ->name('pickups.data');
        Route::get('/delivery-requests', [AdminDeliveryRequestsController::class, 'index'])->name('deliveries.index');
        Route::get('/delivery-requests/data', [AdminDeliveryRequestsController::class, 'data'])->name('deliveries.data');

        Route::get('/customers', [AdminCustomersController::class, 'index'])
            ->name('customers.index');

        Route::get('/customers/data', [AdminCustomersController::class, 'data'])
            ->name('customers.data');

        Route::get('/messages', [AdminMessagesController::class, 'index'])
            ->name('messages.index');

        Route::get('/messages/data', [AdminMessagesController::class, 'data'])
            ->name('messages.data');

        Route::get('/branches', [AdminBranchesController::class, 'index'])
            ->name('branches.index');

        Route::get('/branches/data', [AdminBranchesController::class, 'data'])
            ->name('branches.data');

        Route::get('/staff-management', [AdminStaffController::class, 'index'])
            ->name('staff.index');

        Route::get('/staff-management/data', [AdminStaffController::class, 'data'])
            ->name('staff.data');

        Route::get('/website-content', [AdminWebsiteContentController::class, 'index'])
            ->name('website-content.index');

        Route::get('/website-content/data', [AdminWebsiteContentController::class, 'data'])
            ->name('website-content.data');
    });

Route::prefix('staff')
    ->name('staff.')
    ->group(function () {
        Route::get('/', [StaffDashboardController::class, 'index'])
            ->name('dashboard');

        Route::get('/dashboard/data', [StaffDashboardController::class, 'data'])
            ->name('dashboard.data');

        Route::get('/orders', [StaffOrdersController::class, 'index'])
            ->name('orders.index');

        Route::get('/orders/data', [StaffOrdersController::class, 'data'])
            ->name('orders.data');

        Route::get('/payments', [StaffPaymentsController::class, 'index'])
            ->name('payments.index');

        Route::get('/payments/data', [StaffPaymentsController::class, 'data'])
            ->name('payments.data');

        Route::get('/pickup-requests', [StaffPickupRequestsController::class, 'index'])
            ->name('pickup-requests.index');

        Route::get('/pickup-requests/data', [StaffPickupRequestsController::class, 'data'])
            ->name('pickup-requests.data');

        Route::get('/delivery-requests', [StaffDeliveryRequestsController::class, 'index'])
            ->name('delivery-requests.index');

        Route::get('/delivery-requests/data', [StaffDeliveryRequestsController::class, 'data'])
            ->name('delivery-requests.data');

        Route::get('/products', [StaffProductsController::class, 'index'])
            ->name('products.index');

        Route::get('/products/data', [StaffProductsController::class, 'data'])
            ->name('products.data');

        Route::get('/messages', [StaffMessagesController::class, 'index'])
            ->name('messages.index');

        Route::get('/messages/data', [StaffMessagesController::class, 'data'])
            ->name('messages.data');

        Route::get('/notifications', [StaffNotificationsController::class, 'index'])
            ->name('notifications.index');

        Route::get('/notifications/data', [StaffNotificationsController::class, 'data'])
            ->name('notifications.data');

        Route::get('/customers', [StaffCustomersController::class, 'index'])
            ->name('customers.index');

        Route::get('/customers/data', [StaffCustomersController::class, 'data'])
            ->name('customers.data');

        Route::get('/reports', [StaffReportsController::class, 'index'])
            ->name('reports.index');

        Route::get('/reports/data', [StaffReportsController::class, 'data'])
            ->name('reports.data');

        Route::get('/reviews', [StaffReviewsController::class, 'index'])
            ->name('reviews.index');

        Route::get('/reviews/data', [StaffReviewsController::class, 'data'])
            ->name('reviews.data');
    });
