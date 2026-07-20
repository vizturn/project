<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bagian 3 — Persiapan (khusus izin WAH).
 * PA hanya mengisi JSA (nomor + lampiran file) dan, jika menggunakan
 * perancah, Scaffolding Certificate (nomor + lampiran file).
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
            'nomor_jsa' => ['required', 'string', 'max:50'],
            'jsa_file'  => ['required', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],

            'wah_menggunakan_perancah' => ['required', 'boolean'],
            'wah_scaffolding_cert_nomor' => ['required_if:wah_menggunakan_perancah,1', 'nullable', 'string', 'max:50'],
            'wah_scaffolding_cert_file'  => ['required_if:wah_menggunakan_perancah,1', 'nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'nomor_jsa.required' => 'Nomor JSA wajib diisi.',
            'jsa_file.required'  => 'File JSA wajib dilampirkan.',
            'jsa_file.mimes'     => 'File JSA harus berformat PDF, Word, atau gambar.',
            'wah_scaffolding_cert_nomor.required_if' => 'Nomor Scaffolding Certificate wajib diisi jika menggunakan perancah.',
            'wah_scaffolding_cert_file.required_if'  => 'File Scaffolding Certificate wajib dilampirkan jika menggunakan perancah.',
        ];
    }
}
