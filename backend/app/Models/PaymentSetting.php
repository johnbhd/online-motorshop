<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    protected $fillable = [
        'gcash_account_name',
        'gcash_number',
        'payment_instructions',
        'qr_image_path',
    ];
}
