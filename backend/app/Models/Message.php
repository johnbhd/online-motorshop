<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    public const SENDER_TYPES = ['customer', 'staff', 'admin'];

    protected $fillable = [
        'conversation_id',
        'sender_type',
        'sender_user_id',
        'body',
        'message_type',
        'metadata',
        'attachment_url',
        'attachment_public_id',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }

    public function senderUser()
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }
}
