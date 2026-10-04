<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TrackOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'order_reference' => strtoupper(trim((string) $this->input('order_reference'))),
            'contact_number' => trim((string) $this->input('contact_number')),
        ]);
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'order_reference' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:50', 'regex:/\d{7,}/'],
        ];
    }
}
