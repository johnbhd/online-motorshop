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
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\CustomerOrderController;
use App\Http\Controllers\OrderRequestController;
use App\Http\Controllers\Staff\StaffConversationsController;
use App\Http\Controllers\Staff\StaffCustomersController;
use App\Http\Controllers\Staff\StaffDashboardController;
use App\Http\Controllers\Staff\StaffDeliveryRequestsController;
use App\Http\Controllers\Staff\StaffNotificationsController;
use App\Http\Controllers\Staff\StaffOrdersController;
use App\Http\Controllers\Staff\StaffPaymentsController;
use App\Http\Controllers\Staff\StaffPickupRequestsController;
use App\Http\Controllers\Staff\StaffProductsController;
use App\Http\Controllers\Staff\StaffReportsController;
use App\Http\Controllers\Staff\StaffReviewsController;
use App\Http\Controllers\Staff\StaffSidebarController;
use Illuminate\Support\Facades\Route;

// Connection
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Ilabas mo!!!',
    ]);
});

// Public catalog
Route::get('/products', [CatalogController::class, 'products'])
    ->name('catalog.products.index');
Route::get('/products/{identifier}', [CatalogController::class, 'product'])
    ->name('catalog.products.show');
Route::get('/categories', [CatalogController::class, 'categories'])
    ->name('catalog.categories.index');
Route::get('/branches', [CatalogController::class, 'branches'])
    ->name('catalog.branches.index');
Route::post('/order-requests', [OrderRequestController::class, 'store'])
    ->name('order-requests.store');
Route::post('/order-requests/track', [OrderRequestController::class, 'track'])
    ->name('order-requests.track');

// Customer and guest conversations
Route::get('/conversations/current', [ConversationController::class, 'current'])
    ->name('conversations.current');
Route::post('/conversations', [ConversationController::class, 'store'])
    ->name('conversations.store');
Route::post('/conversations/{conversation}/messages', [ConversationController::class, 'storeMessage'])
    ->name('conversations.messages.store');

Route::prefix('customer')
    ->name('customer.')
    ->middleware([
        'auth:sanctum',
        'role:customer',
    ])
    ->group(function () {
        Route::get('/orders', [CustomerOrderController::class, 'index'])
            ->name('orders.index');
        Route::get('/orders/{reference}', [CustomerOrderController::class, 'show'])
            ->name('orders.show');
    });

// Auth
Route::prefix('auth')->group(function () {
    Route::post('/login', [LoginController::class, 'store'])
        ->name('auth.login');
    Route::post('/register', [RegisterController::class, 'store'])
        ->name('auth.register');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [LoginController::class, 'show'])
            ->name('auth.me');
        Route::post('/logout', [LoginController::class, 'destroy'])
            ->name('auth.logout');
    });

});

// Admin
Route::prefix('admin')
    ->name('admin.')
    ->middleware([
        'auth:sanctum',
        'role:admin',
    ])
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

// Staff
Route::prefix('staff')
    ->name('staff.')
    ->middleware('auth:sanctum')
    ->group(function () {
        Route::middleware('role:staff')->group(function () {
            Route::get('/dashboard/data', [StaffDashboardController::class, 'data'])
                ->name('dashboard.data');

            Route::get('/sidebar-summary', [StaffSidebarController::class, 'data'])
                ->name('sidebar-summary.data');

            Route::get('/orders', [StaffOrdersController::class, 'index'])
                ->name('orders.index');

            Route::get('/orders/data', [StaffOrdersController::class, 'index'])
                ->name('orders.data');

            Route::get('/orders/{reference}', [StaffOrdersController::class, 'show'])
                ->name('orders.show');

            Route::patch('/orders/{reference}/status', [StaffOrdersController::class, 'updateStatus'])
                ->name('orders.status');

            Route::get('/delivery-requests', [StaffDeliveryRequestsController::class, 'index'])
                ->name('delivery-requests.index');

            Route::get('/delivery-requests/data', [StaffDeliveryRequestsController::class, 'data'])
                ->name('delivery-requests.data');

            Route::get('/delivery-requests/{delivery}', [StaffDeliveryRequestsController::class, 'show'])
                ->name('delivery-requests.show');

            Route::patch('/delivery-requests/{delivery}/status', [StaffDeliveryRequestsController::class, 'updateStatus'])
                ->name('delivery-requests.status');

            Route::get('/pickup-requests', [StaffPickupRequestsController::class, 'index'])
                ->name('pickup-requests.index');

            Route::get('/pickup-requests/data', [StaffPickupRequestsController::class, 'data'])
                ->name('pickup-requests.data');

            Route::get('/pickup-requests/{pickup}', [StaffPickupRequestsController::class, 'show'])
                ->name('pickup-requests.show');

            Route::patch('/pickup-requests/{pickup}/status', [StaffPickupRequestsController::class, 'updateStatus'])
                ->name('pickup-requests.status');

            Route::get('/payments', [StaffPaymentsController::class, 'index'])
                ->name('payments.index');

            Route::get('/payments/data', [StaffPaymentsController::class, 'data'])
                ->name('payments.data');

            Route::get('/payments/{payment}', [StaffPaymentsController::class, 'show'])
                ->name('payments.show');

            Route::patch('/payments/{payment}/status', [StaffPaymentsController::class, 'updateStatus'])
                ->name('payments.status');

            Route::get('/conversations', [StaffConversationsController::class, 'index'])
                ->name('conversations.index');

            Route::get('/conversations/{conversation}', [StaffConversationsController::class, 'show'])
                ->name('conversations.show');

            Route::post('/conversations/{conversation}/messages', [StaffConversationsController::class, 'storeMessage'])
                ->name('conversations.messages.store');

            Route::get('/messages/data', [StaffConversationsController::class, 'index'])
                ->name('messages.data');

            Route::get('/customers', [StaffCustomersController::class, 'index'])
                ->name('customers.index');

            Route::get('/customers/{customer}', [StaffCustomersController::class, 'show'])
                ->whereNumber('customer')
                ->name('customers.show');
        });

        Route::middleware('role:admin')->group(function () {
            Route::get('/products/data', [StaffProductsController::class, 'data'])
                ->name('products.data');

            Route::get('/notifications/data', [StaffNotificationsController::class, 'data'])
                ->name('notifications.data');

            Route::get('/reports/data', [StaffReportsController::class, 'data'])
                ->name('reports.data');

            Route::get('/reviews/data', [StaffReviewsController::class, 'data'])
                ->name('reviews.data');
        });
    });
