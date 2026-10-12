<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LinkGoogleAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'link_token' => ['required', 'string', 'min:32', 'max:128'],
            'password' => ['required', 'string'],
        ];
    }
}
