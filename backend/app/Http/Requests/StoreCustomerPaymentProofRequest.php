<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerPaymentProofRequest extends FormRequest
{
    public function authorize(): bool
    {
        return ($this->user()?->role === 'customer'
                && $this->user()?->status === 'active')
            || filled($this->header('X-Order-Tracking-Token'));
    }

    public function rules(): array
    {
        return [
            'proof' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:15360',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'proof.required' => 'Choose a payment receipt image to upload.',
            'proof.file' => 'Payment proof must be a valid uploaded image file.',
            'proof.image' => 'Payment proof must be an image.',
            'proof.mimes' => 'Payment proof must be a JPG, JPEG, PNG, or WEBP image.',
            'proof.max' => 'Payment proof must be 15 MB or smaller.',
        ];
    }
}
