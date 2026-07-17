<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bagian 8 — Revalidasi (IA menentukan sendiri tanggal & jam revalidasi,
 * lalu izin dikirim kembali ke PA sebagai AKTIF). Form ini terpisah dari
 * Pengembalian yang diisi PA — tidak mengoreksi tanggal/jam PA.
 */
class RevalidatePermitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:IA
    }

    public function rules(): array
    {
        return [
            'tanggal' => ['required', 'date_format:Y-m-d'],
            'jam'     => ['required', 'date_format:H:i'],
        ];
    }

    public function messages(): array
    {
        return [
            'tanggal.required' => 'Tanggal revalidasi wajib diisi.',
            'jam.required'     => 'Jam revalidasi wajib diisi.',
        ];
    }
}
