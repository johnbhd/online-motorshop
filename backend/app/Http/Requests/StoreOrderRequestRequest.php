<?php

namespace App\Http\Requests;

use App\Models\Payment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreOrderRequestRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $user = Auth::guard('sanctum')->user();

        if ($this->input('fulfillment.method') !== 'delivery' || ! $user) {
            return;
        }

        $customer = $user->loadMissing('customer')->customer;

        if (! $customer) {
            return;
        }

        $delivery = (array) $this->input('fulfillment.delivery', []);
        $defaults = [
            'address' => $customer->address,
            'barangay' => $customer->barangay,
            'barangay_code' => $customer->barangay_code,
            'city' => $customer->city,
            'city_municipality_code' => $customer->city_municipality_code,
            'contact_number' => $customer->contact_number,
            'contact_person' => $customer->full_name,
            'latitude' => $customer->latitude,
            'longitude' => $customer->longitude,
        ];

        foreach ($defaults as $field => $value) {
            if (! array_key_exists($field, $delivery) || $delivery[$field] === null || $delivery[$field] === '') {
                $delivery[$field] = $value;
            }
        }

        $this->merge([
            'fulfillment' => [
                ...(array) $this->input('fulfillment'),
                'delivery' => $delivery,
            ],
        ]);
    }

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string|ValidationRule>>
     */
    public function rules(): array
    {
        return [
            'customer' => ['sometimes', 'array'],
            'customer.name' => ['sometimes', 'string', 'max:255'],
            'customer.email' => ['sometimes', 'email', 'max:255'],
            'customer.contact_number' => ['sometimes', 'string', 'max:30'],
            'customer.address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'guest_token' => ['sometimes', 'nullable', 'string', 'min:32', 'max:128'],

            'items' => ['required', 'array', 'min:1'],
            'items.*' => ['required', 'array'],
            'items.*.part_number' => ['required', 'string', 'max:255', 'distinct'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000'],

            'payment_method' => [
                'required',
                'string',
                Rule::in(Payment::METHOD_VALUES),
            ],

            'fulfillment' => ['required', 'array'],
            'fulfillment.method' => [
                'required',
                'string',
                Rule::in(['pickup', 'delivery']),
            ],
            'fulfillment.branch_id' => [
                'required',
                'integer',
                'exists:branches,id',
            ],
            'fulfillment.delivery' => [
                'sometimes',
                'array',
                'prohibited_unless:fulfillment.method,delivery',
            ],
            'fulfillment.delivery.address' => [
                'required_if:fulfillment.method,delivery',
                'string',
                'max:1000',
            ],
            'fulfillment.delivery.barangay' => [
                'required_if:fulfillment.method,delivery',
                'string',
                'max:255',
            ],
            'fulfillment.delivery.barangay_code' => [
                'sometimes',
                'nullable',
                'string',
                'regex:/^\d{10}$/',
            ],
            'fulfillment.delivery.city' => [
                'required_if:fulfillment.method,delivery',
                'string',
                'max:255',
            ],
            'fulfillment.delivery.city_municipality_code' => [
                'sometimes',
                'nullable',
                'string',
                'regex:/^\d{10}$/',
            ],
            'fulfillment.delivery.contact_person' => [
                'required_if:fulfillment.method,delivery',
                'string',
                'max:200',
            ],
            'fulfillment.delivery.contact_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
            ],
            'fulfillment.delivery.latitude' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-90,90',
                Rule::requiredIf(fn (): bool => $this->filled('fulfillment.delivery.longitude')),
            ],
            'fulfillment.delivery.longitude' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-180,180',
                Rule::requiredIf(fn (): bool => $this->filled('fulfillment.delivery.latitude')),
            ],
            'fulfillment.delivery.notes' => [
                'sometimes',
                'nullable',
                'string',
                'max:200',
            ],

            'order_notes' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (
                    $this->input('fulfillment.method') === 'delivery' &&
                    $this->input('payment_method') === Payment::METHOD_PAY_AT_PICKUP
                ) {
                    $validator->errors()->add(
                        'payment_method',
                        'Pay at Pickup is only available for Store Pickup orders.',
                    );
                }
            },
        ];
    }
}
