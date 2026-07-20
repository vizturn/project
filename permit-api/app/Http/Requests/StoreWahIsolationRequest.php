<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bagian 3 — Persiapan (bagian IA, khusus WAH).
 * IA menentukan apakah Isolasi Energi diperlukan. Jika Ya, Sertifikat
 * Isolasi (nomor + file) wajib dilampirkan; jika Tidak, boleh dikosongkan.
 */
class StoreWahIsolationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:IA + pengecekan penugasan di controller
    }

    public function rules(): array
    {
        return [
            'wah_isolasi_diperlukan' => ['required', 'boolean'],
            'wah_isolasi_cert_nomor' => ['required_if:wah_isolasi_diperlukan,1', 'nullable', 'string', 'max:50'],
            'wah_isolasi_cert_file'  => ['required_if:wah_isolasi_diperlukan,1', 'nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'wah_isolasi_diperlukan.required' => 'Pilih apakah Isolasi Energi diperlukan.',
            'wah_isolasi_cert_nomor.required_if' => 'Nomor Sertifikat Isolasi wajib diisi jika Isolasi Energi diperlukan.',
            'wah_isolasi_cert_file.required_if'  => 'File Sertifikat Isolasi wajib dilampirkan jika Isolasi Energi diperlukan.',
        ];
    }
}
