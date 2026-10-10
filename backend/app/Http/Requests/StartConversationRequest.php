<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StartConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'max:2000'],
            'guest_token' => ['sometimes', 'nullable', 'string', 'min:32', 'max:128'],
            'message_type' => ['sometimes', 'string', 'in:text,contact_inquiry'],
            'metadata' => ['sometimes', 'nullable', 'json', 'max:12000'],
            'attachment' => [
                'sometimes',
                'nullable',
                'file',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ];
    }
}
