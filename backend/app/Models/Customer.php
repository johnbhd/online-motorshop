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
        'address'
    ];

    public function user() 
    {
        return $this->belongsTo(User::class);
    }

    public function orderRequests()
    {
        return $this->hasMany(OrderRequest::class);
    }
}
