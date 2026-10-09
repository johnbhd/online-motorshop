<?php

namespace App\Http\Requests;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminPaymentIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'search' => ['sometimes', 'nullable', 'string', 'max:100'],
            'branch_id' => ['sometimes', 'nullable', 'integer', Rule::exists('branches', 'id')],
            'method' => ['sometimes', 'nullable', 'string', Rule::in(Payment::METHOD_VALUES)],
            'status' => ['sometimes', 'nullable', 'string', Rule::in(Payment::STATUS_VALUES)],
            'fulfillment' => ['sometimes', 'nullable', 'string', Rule::in(['pickup', 'delivery'])],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
