<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'branch_id',
        'status',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer()
    {
        return $this->hasOne(Customer::class);
    }

    public function assignedOrders()
    {
        return $this->hasMany(OrderRequest::class, 'assigned_staff_id');
    }

    public function verifiedPayments()
    {
        return $this->hasMany(Payment::class, 'verified_by');
    }

    public function assignedPickupRequests()
    {
        return $this->hasMany(PickupRequest::class, 'assigned_staff_id');
    }

    public function assignedDeliveryRequests()
    {
        return $this->hasMany(DeliveryRequest::class, 'assigned_staff_id');
    }

    public function sentMessages()
    {
        return $this->hasMany(Message::class, 'sender_user_id');
    }
}
