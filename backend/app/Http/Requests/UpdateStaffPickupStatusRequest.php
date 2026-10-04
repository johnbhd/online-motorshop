<?php

namespace App\Http\Requests;

use App\Models\PickupRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStaffPickupStatusRequest extends FormRequest
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
                Rule::in(PickupRequest::STATUS_VALUES),
            ],
        ];
    }
}
