<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class MediaAsset extends Model
{
    public const PURPOSE_PRODUCT_IMAGE = 'product_image';

    public const PURPOSE_PAYMENT_PROOF = 'payment_proof';

    public const PURPOSE_CONTACT_INQUIRY_ATTACHMENT = 'contact_inquiry_attachment';

    public const PURPOSE_MESSAGE_ATTACHMENT = 'message_attachment';

    public const PURPOSE_VALUES = [
        self::PURPOSE_PRODUCT_IMAGE,
        self::PURPOSE_PAYMENT_PROOF,
        self::PURPOSE_CONTACT_INQUIRY_ATTACHMENT,
        self::PURPOSE_MESSAGE_ATTACHMENT,
    ];

    public const STATUS_ACTIVE = 'active';

    public const STATUS_PENDING = 'pending';

    public const STATUS_ORPHANED = 'orphaned';

    public const STATUS_CANCELED = 'canceled';

    public const STATUS_DELETED = 'deleted';

    public const STATUS_CLEANUP_FAILED = 'cleanup_failed';

    public const STATUS_VALUES = [
        self::STATUS_ACTIVE,
        self::STATUS_PENDING,
        self::STATUS_ORPHANED,
        self::STATUS_CANCELED,
        self::STATUS_DELETED,
        self::STATUS_CLEANUP_FAILED,
    ];

    protected $fillable = [
        'cloudinary_public_id',
        'secure_url',
        'resource_type',
        'purpose',
        'linked_type',
        'linked_id',
        'status',
        'original_filename',
        'mime_type',
        'bytes',
        'uploaded_by_user_id',
        'uploaded_at',
        'deleted_by_user_id',
        'deleted_at',
        'metadata',
        'cleanup_error',
    ];

    protected function casts(): array
    {
        return [
            'linked_id' => 'integer',
            'bytes' => 'integer',
            'uploaded_by_user_id' => 'integer',
            'deleted_by_user_id' => 'integer',
            'uploaded_at' => 'datetime',
            'deleted_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }

    public function deletedBy()
    {
        return $this->belongsTo(User::class, 'deleted_by_user_id');
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }
}
