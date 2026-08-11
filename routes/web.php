<?php

use App\Http\Controllers\Staff\StaffDashboardController;
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
    });
