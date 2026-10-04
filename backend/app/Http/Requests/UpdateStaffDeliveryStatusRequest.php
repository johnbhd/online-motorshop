<?php

namespace App\Http\Requests;

use App\Models\DeliveryRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffDeliveryStatusRequest extends FormRequest
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
                Rule::in(DeliveryRequest::STATUS_VALUES),
            ],
            'booking_reference' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'tracking_url' => [
                'sometimes',
                'nullable',
                'url',
                'max:2048',
            ],
            'rider_name' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'rider_contact' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
            ],
            'remarks' => [
                'sometimes',
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }
}
