<?php

use App\Http\Controllers\Staff\StaffDashboardController;
use App\Http\Controllers\Staff\StaffOrdersController;
use App\Http\Controllers\Staff\StaffPaymentsController;
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
    });
