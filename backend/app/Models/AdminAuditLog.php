<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminAuditLog extends Model
{
    protected $fillable = [
        'actor_user_id',
        'actor_role',
        'action',
        'record_type',
        'record_id',
        'record_reference',
        'previous_status',
        'new_status',
        'reason',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'record_id' => 'integer',
            'actor_user_id' => 'integer',
            'metadata' => 'array',
        ];
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
