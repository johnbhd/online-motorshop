<?php

namespace App\Http\Requests;

class UpdateAdminDeliveryStatusRequest extends UpdateStaffDeliveryStatusRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }
}
