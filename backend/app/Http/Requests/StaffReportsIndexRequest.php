<?php

namespace App\Http\Requests;

use App\Models\OrderRequest;
use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StaffReportsIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'to' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
            'fulfillment' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(['pickup', 'delivery']),
            ],
            'order_status' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(OrderRequest::STAFF_STATUS_VALUES),
            ],
            'payment_status' => [
                'sometimes',
                'nullable',
                'string',
                Rule::in(Payment::STATUS_VALUES),
            ],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }
}
