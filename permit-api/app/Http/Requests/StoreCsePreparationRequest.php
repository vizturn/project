<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bagian 3 — Persiapan (bagian PA, khusus CSE).
 * Petugas Jaga dicatat sebagai nama bebas (tidak harus pengguna terdaftar),
 * karena petugas jaga di lapangan tidak selalu memiliki akun sistem.
 */
class StoreCsePreparationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:PA + pengecekan pemilik di controller
    }

    public function rules(): array
    {
        return [
            'cse_petugas_jaga_nama' => ['required', 'string', 'max:150'],
            'cse_alat_komunikasi'   => ['nullable', 'string', 'max:100'],
            'nomor_jsa'             => ['nullable', 'string', 'max:50'],
            'jsa_file'              => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'peralatan'             => ['nullable', 'array'],
            'peralatan.*'           => ['string', 'max:50'],
            'peralatan_lainnya'     => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'cse_petugas_jaga_nama.required' => 'Nama Petugas Jaga wajib diisi.',
        ];
    }
}
