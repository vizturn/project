<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreScreeningRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Otorisasi peran ditangani middleware 'role:PA' di route.
        return true;
    }

    public function rules(): array
    {
        return [
            // Boleh kosong (berarti: tidak butuh izin), tapi key wajib ada.
            'checked_criteria'   => ['present', 'array'],
            'checked_criteria.*' => ['integer', 'distinct', 'exists:screening_criteria,no_kriteria'],
        ];
    }

    public function messages(): array
    {
        return [
            'checked_criteria.present'   => 'Data kriteria wajib dikirim.',
            'checked_criteria.array'     => 'Format kriteria harus berupa daftar.',
            'checked_criteria.*.exists'  => 'Terdapat nomor kriteria yang tidak valid.',
            'checked_criteria.*.distinct' => 'Terdapat kriteria yang terduplikasi.',
        ];
    }
}
