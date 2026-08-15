<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'unit_price',
        'quantity',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'quantity' => 'integer',
            'subtotal' => 'decimal:2'
        ];
    }

    public function order()
    {
        return $this->belongsTo(OrderRequest::class, 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
