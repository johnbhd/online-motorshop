<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderRequest extends Model
{
    public const TERMINAL_STATUSES = [
        'completed',
        'rejected',
        'cancelled',
    ];

    public const STAFF_STATUS_VALUES = [
        'pending',
        'under_review',
        'confirmed',
        'waiting_for_payment',
        'payment_verification',
        'preparing_order',
        'ready_for_pickup',
        'booked_for_delivery',
        'picked_up_by_rider',
        'waiting_for_booking',
        'completed',
        'rejected',
        'cancelled',
    ];

    protected $fillable = [
        'order_reference',
        'customer_id',
        'branch_id',
        'assigned_staff_id',
        'fulfillment_type',
        'order_status',
        'subtotal',
        'delivery_fee',
        'total_amount',
        'customer_notes',
        'staff_notes',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'delivery_fee' => 'decimal:2',
            'total_amount' => 'decimal:2',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function assignedStaff()
    {
        return $this->belongsTo(User::class, 'assigned_staff_id');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class, 'order_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'order_id');
    }

    public function pickupRequest()
    {
        return $this->hasOne(PickupRequest::class, 'order_id');
    }

    public function deliveryRequest()
    {
        return $this->hasOne(DeliveryRequest::class, 'order_id');
    }

    public function reviews()
    {
        return $this->hasMany(Review::class, 'order_id');
    }
}
