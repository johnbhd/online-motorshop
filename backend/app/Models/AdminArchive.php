<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminArchive extends Model
{
    protected $fillable = [
        'archive_type',
        'archive_id',
        'archived_by',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'archive_id' => 'integer',
            'archived_by' => 'integer',
            'archived_at' => 'datetime',
        ];
    }

    public function archivedBy()
    {
        return $this->belongsTo(User::class, 'archived_by');
    }
}
