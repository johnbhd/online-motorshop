<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PickupRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'branch_id',
        'assigned_staff_id',
        'pickup_date',
        'pickup_time',
        'pickup_status',
        'remarks',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'pickup_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function order()
    {
        return $this->belongsTo(OrderRequest::class, 'order_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function assignedStaff()
    {
        return $this->belongsTo(User::class, 'assigned_staff_id');
    }
}
