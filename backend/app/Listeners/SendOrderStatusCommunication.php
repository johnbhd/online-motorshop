<?php

namespace App\Listeners;

use App\Events\OrderStatusChanged;
use App\Services\OrderCommunicationService;

class SendOrderStatusCommunication
{
    public function __construct(
        private readonly OrderCommunicationService $orderCommunicationService,
    ) {}

    public function handle(OrderStatusChanged $event): void
    {
        $this->orderCommunicationService->handle($event);
    }
}
