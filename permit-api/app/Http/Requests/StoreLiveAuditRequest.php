<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLiveAuditRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:SPV
    }

    public function rules(): array
    {
        return [
            'catatan' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
