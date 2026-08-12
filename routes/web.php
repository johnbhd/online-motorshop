<?php

use App\Http\Controllers\Staff\StaffDashboardController;
use App\Http\Controllers\Staff\StaffCustomersController;
use App\Http\Controllers\Staff\StaffDeliveryRequestsController;
use App\Http\Controllers\Staff\StaffMessagesController;
use App\Http\Controllers\Staff\StaffOrdersController;
use App\Http\Controllers\Staff\StaffPaymentsController;
use App\Http\Controllers\Staff\StaffPickupRequestsController;
use App\Http\Controllers\Staff\StaffProductsController;
use App\Http\Controllers\Staff\StaffReportsController;
use App\Http\Controllers\Staff\StaffReviewsController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('public.home');
})->name('home');

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
