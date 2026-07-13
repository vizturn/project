<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectPermitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:AA
    }

    public function rules(): array
    {
        return [
            'alasan' => ['nullable', 'string', 'max:500'],
        ];
    }
}
