<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SendAdminConversationMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:2000'],
        ];
    }
}
