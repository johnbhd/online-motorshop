<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryRequest extends Model
{
    protected $fillable = [
        'order_id',
        'branch_id',
        'assigned_staff_id',
        'delivery_address',
        'delivery_fee',
        'booking_reference',
        'tracking_url',
        'rider_name',
        'rider_contact',
        'delivery_status',
        'remarks',
        'delivered_at',
    ];

    protected function casts(): array 
    {
        return [
          'delivery_fee' => 'decimal:2',
          'delivered_at' => 'datetime',
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
