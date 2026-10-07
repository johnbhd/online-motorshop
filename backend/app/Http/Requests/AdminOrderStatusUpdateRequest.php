<?php

namespace App\Http\Requests;

use App\Models\OrderRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminOrderStatusUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(OrderRequest::STAFF_STATUS_VALUES)],
        ];
    }
}
