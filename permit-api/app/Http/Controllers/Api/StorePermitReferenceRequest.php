<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePermitReferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // otorisasi peran & penugasan dicek di controller
    }

    public function rules(): array
    {
        return [
            'ref_confined_space_entry'    => ['nullable', 'string', 'max:50'],
            'ref_bekerja_di_ketinggian'   => ['nullable', 'string', 'max:50'],
            'ref_isolation'               => ['nullable', 'string', 'max:50'],
            'sertifikat_scaffolding'      => ['nullable', 'string', 'max:50'],
            'sertifikat_excavation'       => ['nullable', 'string', 'max:50'],
            'sistem_safety_dinonaktifkan' => ['nullable', 'string'],
            'referensi_lainnya'           => ['nullable', 'string'],
        ];
    }
}
