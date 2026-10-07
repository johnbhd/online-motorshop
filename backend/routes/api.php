<?php

use App\Http\Controllers\Admin\AdminBranchesController;
use App\Http\Controllers\Admin\AdminBrandController;
use App\Http\Controllers\Admin\AdminCategoryController;
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
use App\Http\Controllers\Staff\StaffProfileController;
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
        Route::post('/orders/{reference}/payment-proof', [CustomerOrderController::class, 'storePaymentProof'])
            ->name('orders.payment-proof.store');
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

        Route::get('/products', [AdminProductController::class, 'index'])
            ->name('products.index');

        Route::get('/products/data', [AdminProductController::class, 'data'])
            ->name('products.data');

        Route::post('/products', [AdminProductController::class, 'store'])
            ->name('products.store');

        Route::get('/products/{partNumber}', [AdminProductController::class, 'show'])
            ->name('products.show');

        Route::patch('/products/{partNumber}', [AdminProductController::class, 'update'])
            ->name('products.update');

        Route::delete('/products/{partNumber}', [AdminProductController::class, 'destroy'])
            ->name('products.destroy');

        Route::get('/categories', [AdminCategoryController::class, 'index'])
            ->name('categories.index');

        Route::post('/categories', [AdminCategoryController::class, 'store'])
            ->name('categories.store');

        Route::get('/categories/{category}/products', [AdminCategoryController::class, 'products'])
            ->name('categories.products');

        Route::get('/categories/{category}', [AdminCategoryController::class, 'show'])
            ->name('categories.show');

        Route::patch('/categories/{category}', [AdminCategoryController::class, 'update'])
            ->name('categories.update');

        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy'])
            ->name('categories.destroy');

        Route::get('/brands', [AdminBrandController::class, 'index'])
            ->name('brands.index');

        Route::post('/brands', [AdminBrandController::class, 'store'])
            ->name('brands.store');

        Route::get('/brands/{brand}/products', [AdminBrandController::class, 'products'])
            ->name('brands.products');

        Route::get('/brands/{brand}', [AdminBrandController::class, 'show'])
            ->name('brands.show');

        Route::patch('/brands/{brand}', [AdminBrandController::class, 'update'])
            ->name('brands.update');

        Route::delete('/brands/{brand}', [AdminBrandController::class, 'destroy'])
            ->name('brands.destroy');

        Route::get('/branches', [AdminBranchesController::class, 'index'])
            ->name('branches.index');

        Route::post('/branches', [AdminBranchesController::class, 'store'])
            ->name('branches.store');

        Route::get('/branches/data', [AdminBranchesController::class, 'data'])
            ->name('branches.data');

        Route::get('/branches/{branch}', [AdminBranchesController::class, 'show'])
            ->name('branches.show');

        Route::patch('/branches/{branch}', [AdminBranchesController::class, 'update'])
            ->name('branches.update');

        Route::delete('/branches/{branch}', [AdminBranchesController::class, 'destroy'])
            ->name('branches.destroy');

        Route::get('/staff', [AdminStaffController::class, 'index'])
            ->name('staff.index');

        Route::post('/staff', [AdminStaffController::class, 'store'])
            ->name('staff.store');

        Route::get('/staff/data', [AdminStaffController::class, 'data'])
            ->name('staff.data');

        Route::get('/staff/{staff}', [AdminStaffController::class, 'show'])
            ->name('staff.show');

        Route::patch('/staff/{staff}', [AdminStaffController::class, 'update'])
            ->name('staff.update');

        Route::patch('/staff/{staff}/password', [AdminStaffController::class, 'updatePassword'])
            ->name('staff.password');

        Route::delete('/staff/{staff}', [AdminStaffController::class, 'destroy'])
            ->name('staff.destroy');

        Route::get('/orders', [AdminOrdersController::class, 'index'])
            ->name('orders.index');

        Route::get('/orders/data', [AdminOrdersController::class, 'data'])
            ->name('orders.data');

        Route::get('/orders/{reference}', [AdminOrdersController::class, 'show'])
            ->name('orders.show');

        Route::patch('/orders/{reference}/status', [AdminOrdersController::class, 'updateStatus'])
            ->name('orders.status');

        Route::patch('/orders/{reference}/assignment', [AdminOrdersController::class, 'updateAssignment'])
            ->name('orders.assignment');

        Route::get('/payments', [AdminPaymentsController::class, 'index'])
            ->name('payments.index');

        Route::get('/payments/data', [AdminPaymentsController::class, 'data'])
            ->name('payments.data');

        Route::get('/payments/{payment}', [AdminPaymentsController::class, 'show'])
            ->whereNumber('payment')
            ->name('payments.show');

        Route::patch('/payments/{payment}/status', [AdminPaymentsController::class, 'updateStatus'])
            ->whereNumber('payment')
            ->name('payments.status');

        Route::get('/pickup-requests/data', [AdminPickupRequestsController::class, 'data'])
            ->name('pickups.data');

        Route::get('/delivery-requests/data', [AdminDeliveryRequestsController::class, 'data'])
            ->name('deliveries.data');

        Route::get('/customers', [AdminCustomersController::class, 'index'])
            ->name('customers.index');

        Route::get('/customers/data', [AdminCustomersController::class, 'data'])
            ->name('customers.data');

        Route::get('/customers/{customer}', [AdminCustomersController::class, 'show'])
            ->whereNumber('customer')
            ->name('customers.show');

        Route::patch('/customers/{customer}', [AdminCustomersController::class, 'update'])
            ->whereNumber('customer')
            ->name('customers.update');

        Route::delete('/customers/{customer}', [AdminCustomersController::class, 'destroy'])
            ->whereNumber('customer')
            ->name('customers.destroy');

        Route::get('/messages/data', [AdminMessagesController::class, 'data'])
            ->name('messages.data');

        Route::get('/staff-management/data', [AdminStaffController::class, 'data'])
            ->name('staff-management.data');

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

            Route::get('/products', [StaffProductsController::class, 'index'])
                ->name('products.index');

            Route::get('/products/data', [StaffProductsController::class, 'index'])
                ->name('products.data');

            Route::get('/products/{partNumber}', [StaffProductsController::class, 'show'])
                ->name('products.show');

            Route::get('/profile', [StaffProfileController::class, 'show'])
                ->name('profile.show');

            Route::patch('/profile', [StaffProfileController::class, 'update'])
                ->name('profile.update');
        });

        Route::middleware('role:admin')->group(function () {
            Route::get('/notifications/data', [StaffNotificationsController::class, 'data'])
                ->name('notifications.data');

            Route::get('/reports/data', [StaffReportsController::class, 'data'])
                ->name('reports.data');

            Route::get('/reviews/data', [StaffReviewsController::class, 'data'])
                ->name('reviews.data');
        });
    });
