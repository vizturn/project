<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGasTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:AGT
    }

    public function rules(): array
    {
        return [
            'oksigen_persen' => ['required', 'numeric', 'between:0,100'],
            'lel_persen'     => ['required', 'numeric', 'min:0'],
            'co_ppm'         => ['nullable', 'numeric', 'min:0'],
            'h2s_ppm'        => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
