<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bagian 3 — Persiapan (khusus izin WAH).
 * PA boleh mengisi JSA (nomor + lampiran file) dan, jika menggunakan
 * perancah, Scaffolding Certificate (nomor + lampiran file) — SEMUA
 * field opsional, boleh dikirim kosong.
 */
class StoreWahPreparationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:PA + pengecekan pemilik di controller
    }

    public function rules(): array
    {
        return [
            'nomor_jsa' => ['nullable', 'string', 'max:50'],
            'jsa_file'  => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],

            'wah_menggunakan_perancah'   => ['nullable', 'boolean'],
            'wah_scaffolding_cert_nomor' => ['nullable', 'string', 'max:50'],
            'wah_scaffolding_cert_file'  => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'jsa_file.mimes' => 'File JSA harus berformat PDF, Word, atau gambar.',
            'wah_scaffolding_cert_file.mimes' => 'File Scaffolding Certificate harus berformat PDF, Word, atau gambar.',
        ];
    }
}
