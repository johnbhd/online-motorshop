<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class AssistantChatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'message' => [
                'required',
                'string',
                'max:'.config('assistant.max_message_length', 1000),
            ],
            'history' => [
                'sometimes',
                'array',
                'max:'.config('assistant.history_limit', 6),
            ],
            'history.*' => ['array'],
            'history.*.role' => ['required', 'string', 'in:user,assistant'],
            'history.*.content' => [
                'required',
                'string',
                'max:'.config('assistant.max_message_length', 1000),
            ],
            'history.*.product_context' => [
                'sometimes',
                'array',
                'max:5',
            ],
            'history.*.product_context.*' => ['array'],
            'history.*.product_context.*.name' => [
                'required',
                'string',
                'max:200',
            ],
            'history.*.product_context.*.product_code' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'history.*.product_context.*.brand' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'history.*.product_context.*.category' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'history.*.product_context.*.price' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],
            'replyTo' => [
                'sometimes',
                'nullable',
                'array',
            ],
            'replyTo.role' => [
                'required_with:replyTo',
                'string',
                'in:user,assistant',
            ],
            'replyTo.content' => [
                'required_with:replyTo',
                'string',
                'max:'.config('assistant.max_message_length', 1000),
            ],
        ];
    }

    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(response()->json([
            'message' => 'Please check your assistant message and try again.',
            'code' => 'assistant_invalid_request',
            'errors' => $validator->errors(),
        ], 422));
    }
}
