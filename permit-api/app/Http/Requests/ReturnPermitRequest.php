<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bagian 8 — Pengembalian (PA mengembalikan izin AKTIF menjadi DITUNDA).
 * PA menuliskan tanggal & jam pengembalian secara manual (bukan otomatis now()),
 * sesuai kolom "Tanggal" / "Jam" pada bagian Pengembalian di formulir fisik.
 */
class ReturnPermitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:PA + pengecekan pemilik di controller
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
            'tanggal.required' => 'Tanggal pengembalian wajib diisi.',
            'jam.required'     => 'Jam pengembalian wajib diisi.',
        ];
    }
}
