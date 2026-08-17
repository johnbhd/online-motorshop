<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'payment_method',
        'amount',
        'payment_reference',
        'proof_image_url',
        'payment_status',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'verified_at' => 'datetime'
        ];
    }

    public function order() 
    {
        return $this->belongsTo(OrderRequest::class, 'order_id');   
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
