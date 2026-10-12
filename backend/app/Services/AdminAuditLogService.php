<?php

namespace App\Services;

use App\Models\AdminAuditLog;
use App\Models\User;

class AdminAuditLogService
{
    public function record(
        User $actor,
        string $action,
        string $recordType,
        int $recordId,
        ?string $recordReference,
        ?string $previousStatus,
        ?string $newStatus,
        string $reason,
        array $metadata = [],
    ): AdminAuditLog {
        return AdminAuditLog::query()->create([
            'actor_user_id' => $actor->id,
            'actor_role' => (string) $actor->role,
            'action' => $action,
            'record_type' => $recordType,
            'record_id' => $recordId,
            'record_reference' => $recordReference,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'reason' => $reason,
            'metadata' => $metadata === [] ? null : $metadata,
        ]);
    }

    /** @return array<int, array<string, mixed>> */
    public function history(string $recordType, int $recordId): array
    {
        return AdminAuditLog::query()
            ->where('record_type', $recordType)
            ->where('record_id', $recordId)
            ->with('actor:id,name,role')
            ->latest('created_at')
            ->latest('id')
            ->limit(20)
            ->get()
            ->map(fn (AdminAuditLog $audit): array => [
                'id' => $audit->id,
                'action' => $audit->action,
                'record_type' => $audit->record_type,
                'record_id' => $audit->record_id,
                'record_reference' => $audit->record_reference,
                'previous_status' => $audit->previous_status,
                'new_status' => $audit->new_status,
                'reason' => $audit->reason,
                'actor' => $audit->actor?->only(['id', 'name', 'role']),
                'created_at' => $audit->created_at?->toISOString(),
            ])
            ->values()
            ->all();
    }
}
