<?php

namespace App\Http\Requests;

use App\Models\OrderRequest;
use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminOrderIndexRequest extends FormRequest
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
            'status' => ['sometimes', 'nullable', 'string', Rule::in(OrderRequest::STAFF_STATUS_VALUES)],
            'fulfillment' => ['sometimes', 'nullable', 'string', Rule::in(['pickup', 'delivery'])],
            'payment_status' => ['sometimes', 'nullable', 'string', Rule::in(Payment::STATUS_VALUES)],
            'assigned_staff_id' => ['sometimes', 'nullable', 'integer', Rule::exists('users', 'id')],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ];
    }
}
