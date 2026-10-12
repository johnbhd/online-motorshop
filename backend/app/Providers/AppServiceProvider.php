<?php

namespace App\Providers;

use App\Events\OrderStatusChanged;
use App\Listeners\SendOrderStatusCommunication;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(OrderStatusChanged::class, SendOrderStatusCommunication::class);
    }
}
