<?php

namespace App\Http\Requests;

use App\Models\PickupRequest;
use Illuminate\Validation\Rule;

class UpdateAdminPickupStatusRequest extends UpdateStaffPickupStatusRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(PickupRequest::STATUS_VALUES)],
            'reason' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
