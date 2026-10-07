<?php

namespace App\Http\Requests;

use App\Models\Payment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreOrderRequestRequest extends FormRequest
{
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
            'fulfillment.delivery.city' => [
                'required_if:fulfillment.method,delivery',
                'string',
                'max:255',
            ],
            'fulfillment.delivery.contact_person' => [
                'required_if:fulfillment.method,delivery',
                'string',
                'max:200',
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
