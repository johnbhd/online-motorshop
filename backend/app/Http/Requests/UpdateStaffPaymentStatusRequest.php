<?php

namespace App\Http\Requests;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffPaymentStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'staff'
            && $this->user()?->branch_id !== null;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                'string',
                Rule::in(Payment::STATUS_VALUES),
            ],
        ];
    }
}
