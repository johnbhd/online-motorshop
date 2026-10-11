<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryRequest extends Model
{
    public const STATUS_VALUES = [
        'waiting_for_booking',
        'booked',
        'picked_up',
        'in_transit',
        'delivered',
        'failed',
        'cancelled',
    ];

    protected $fillable = [
        'order_id',
        'branch_id',
        'assigned_staff_id',
        'delivery_address',
        'delivery_complete_address',
        'delivery_city_municipality',
        'delivery_city_municipality_code',
        'delivery_barangay',
        'delivery_barangay_code',
        'delivery_latitude',
        'delivery_longitude',
        'delivery_contact_person',
        'delivery_contact_number',
        'delivery_notes',
        'delivery_fee',
        'booking_reference',
        'tracking_url',
        'rider_name',
        'rider_contact',
        'vehicle_plate',
        'delivery_status',
        'remarks',
        'delivered_at',
    ];

    protected function casts(): array
    {
        return [
            'delivery_fee' => 'decimal:2',
            'delivery_latitude' => 'float',
            'delivery_longitude' => 'float',
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
