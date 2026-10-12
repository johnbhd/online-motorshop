<?php

namespace App\Events;

use App\Models\OrderRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusChanged implements ShouldDispatchAfterCommit
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public readonly string $eventKey;

    public function __construct(
        public readonly OrderRequest $order,
        public readonly string $source,
        public readonly int $subjectId,
        public readonly string $previousStatus,
        public readonly string $status,
        public readonly ?string $eventKeySuffix = null,
    ) {
        $baseEventKey = sprintf(
            'order-update:%s:%d:%s',
            $this->source,
            $this->subjectId,
            $this->status,
        );
        $this->eventKey = $this->eventKeySuffix === null
            ? $baseEventKey
            : $baseEventKey.':'.$this->eventKeySuffix;
    }
}
