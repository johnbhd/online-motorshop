<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    public const STATUS_PENDING = 'pending_review';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_FLAGGED = 'flagged';

    public const STATUS_HIDDEN = 'hidden';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PUBLISHED,
        self::STATUS_FLAGGED,
        self::STATUS_HIDDEN,
    ];

    protected $fillable = [
        'product_id', 'customer_id', 'order_id', 'order_item_id', 'rating',
        'review_text', 'status', 'verified_purchase', 'flag_reason', 'flagged_by',
        'flagged_at', 'response_text', 'response_user_id', 'response_at',
        'moderated_by', 'moderated_at', 'published_at', 'hidden_at',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'verified_purchase' => 'boolean',
            'flagged_at' => 'datetime',
            'response_at' => 'datetime',
            'moderated_at' => 'datetime',
            'published_at' => 'datetime',
            'hidden_at' => 'datetime',
        ];
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function order()
    {
        return $this->belongsTo(OrderRequest::class, 'order_id');
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class, 'order_item_id');
    }

    public function flaggedBy()
    {
        return $this->belongsTo(User::class, 'flagged_by');
    }

    public function responseUser()
    {
        return $this->belongsTo(User::class, 'response_user_id');
    }

    public function moderatedBy()
    {
        return $this->belongsTo(User::class, 'moderated_by');
    }
}
