<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'part_number',
        'brand',
        'description',
        'price',
        'img_url',
        'availability_status',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2'
        ];
    }

    public function category() 
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
    
}
