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
