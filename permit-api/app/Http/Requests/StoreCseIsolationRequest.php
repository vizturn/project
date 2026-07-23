<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bagian 3 — Persiapan (bagian IA, khusus CSE).
 * IA menentukan apakah Isolasi Energi diperlukan sebelum masuk ruang terbatas.
 */
class StoreCseIsolationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:IA + pengecekan penugasan di controller
    }

    public function rules(): array
    {
        return [
            'cse_isolasi_diperlukan' => ['required', 'boolean'],
            'cse_isolasi_cert_nomor' => ['required_if:cse_isolasi_diperlukan,1', 'nullable', 'string', 'max:50'],
            'cse_isolasi_cert_file'  => ['required_if:cse_isolasi_diperlukan,1', 'nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'cse_isolasi_diperlukan.required'    => 'Pilih apakah Isolasi Energi diperlukan.',
            'cse_isolasi_cert_nomor.required_if' => 'Nomor Sertifikat Isolasi wajib diisi jika Isolasi Energi diperlukan.',
            'cse_isolasi_cert_file.required_if'  => 'File Sertifikat Isolasi wajib dilampirkan jika Isolasi Energi diperlukan.',
        ];
    }
}
