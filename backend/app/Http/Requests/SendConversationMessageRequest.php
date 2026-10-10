<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendConversationMessageRequest extends FormRequest
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
            'message_type' => ['sometimes', 'string', 'in:text,contact_inquiry,product_inquiry'],
            'product_id' => [
                'nullable',
                'integer',
                Rule::requiredIf(fn (): bool => $this->input('message_type') === 'product_inquiry'),
                Rule::prohibitedIf(fn (): bool => $this->filled('product_id') && $this->input('message_type', 'text') !== 'product_inquiry'),
                Rule::exists('products', 'id'),
            ],
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
