<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'contact_number',
        'email',
        'address',
        'city_municipality_code',
        'barangay_code',
        'city',
        'barangay',
        'latitude',
        'longitude',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function orderRequests()
    {
        return $this->hasMany(OrderRequest::class);
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }
}
