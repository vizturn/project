<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * STEP 26 — Bagian 3: Identifikasi Bahaya dan Pengendalian.
 * Format: hazards[] = [ { permit_type_id, no_bahaya: [...] }, ... ]
 */
class StoreHazardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:PA / role:IA
    }

    public function rules(): array
    {
        return [
            'hazards'                    => ['present', 'array'],
            'hazards.*.permit_type_id'   => ['required', 'integer', 'exists:permit_types,id'],
            'hazards.*.no_bahaya'        => ['present', 'array'],
            // CATATAN: JANGAN pakai 'distinct' di sini — Laravel membandingkan lintas
            // kelompok, sehingga bahaya nomor sama pada dua jenis izin (mis. 01 pada HWP
            // dan CWP) salah dianggap duplikat. Keunikan diperiksa per kelompok di bawah.
            'hazards.*.no_bahaya.*'      => ['integer', 'min:1'],

            'nomor_jsa'      => ['nullable', 'string', 'max:50'],
            'tingkat_risiko' => ['required', 'in:tinggi,sedang,rendah'],
            'bahaya_lainnya' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /** Keunikan nomor bahaya diperiksa DI DALAM masing-masing jenis izin. */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            foreach ((array) $this->input('hazards', []) as $i => $kelompok) {
                $nomor = collect($kelompok['no_bahaya'] ?? []);

                if ($nomor->count() !== $nomor->unique()->count()) {
                    $v->errors()->add("hazards.{$i}.no_bahaya", 'Terdapat bahaya yang terduplikasi pada jenis izin ini.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'tingkat_risiko.required' => 'Tingkat risiko keseluruhan (berdasarkan JSA) wajib dipilih.',
            'tingkat_risiko.in'       => 'Tingkat risiko harus Tinggi, Sedang, atau Rendah.',
        ];
    }
}
