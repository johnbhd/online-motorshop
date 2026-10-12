<?php

namespace App\Http\Requests;

class UpdateAdminDeliveryStatusRequest extends UpdateStaffDeliveryStatusRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            ...parent::rules(),
            'reason' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
