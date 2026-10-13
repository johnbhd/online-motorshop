<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    public const METHOD_PAY_AT_PICKUP = 'pay_at_pickup';

    public const METHOD_ONLINE_PAYMENT = 'online_payment';

    public const METHOD_VALUES = [
        self::METHOD_PAY_AT_PICKUP,
        self::METHOD_ONLINE_PAYMENT,
    ];

    public const STATUS_UNPAID = 'unpaid';

    public const STATUS_WAITING_FOR_VERIFICATION = 'waiting_for_verification';

    public const STATUS_PAID = 'paid';

    public const STATUS_FAILED = 'failed';

    public const STATUS_VALUES = [
        'unpaid',
        'waiting_for_payment',
        'waiting_for_verification',
        'paid',
        'failed',
        'refunded',
        'cancelled',
    ];

    protected $fillable = [
        'order_id',
        'payment_method',
        'amount',
        'payment_reference',
        'proof_image_url',
        'proof_image_public_id',
        'payment_status',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'verified_at' => 'datetime',
        ];
    }

    public function scopeLatestPerOrder(Builder $query): Builder
    {
        return $query->whereNotExists(function ($newerPayment): void {
            $newerPayment
                ->selectRaw('1')
                ->from('payments as newer_payments')
                ->whereColumn('newer_payments.order_id', 'payments.order_id')
                ->where(function ($newer): void {
                    $newer
                        ->whereColumn('newer_payments.created_at', '>', 'payments.created_at')
                        ->orWhere(function ($sameTimestamp): void {
                            $sameTimestamp
                                ->whereColumn('newer_payments.created_at', 'payments.created_at')
                                ->whereColumn('newer_payments.id', '>', 'payments.id');
                        });
                });
        });
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
