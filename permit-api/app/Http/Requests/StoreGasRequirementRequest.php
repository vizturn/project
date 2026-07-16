<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * STEP 27 — Bagian 5: IA menetapkan pengujian kadar gas yang wajib dilakukan
 * dan periode pengetesan ulang.
 */
class StoreGasRequirementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:IA
    }

    public function rules(): array
    {
        return [
            'gas_uji_flammable' => ['required', 'boolean'],
            'gas_uji_oksigen'   => ['required', 'boolean'],
            'gas_uji_beracun'   => ['required', 'boolean'],
            'gas_periode_ulang' => ['nullable', 'string', 'max:100'],
        ];
    }

    /** Bila ada gas yang wajib diuji, periode pengetesan ulang harus diisi. */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $adaUji = $this->boolean('gas_uji_flammable')
                || $this->boolean('gas_uji_oksigen')
                || $this->boolean('gas_uji_beracun');

            if ($adaUji && ! $this->filled('gas_periode_ulang')) {
                $v->errors()->add('gas_periode_ulang', 'Periode pengetesan ulang wajib diisi bila ada gas yang diuji.');
            }
        });
    }
}
