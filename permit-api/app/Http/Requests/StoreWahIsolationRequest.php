<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Bagian 3 — Persiapan (bagian IA, khusus WAH).
 * IA menentukan apakah Isolasi Energi diperlukan. Jika Ya, Sertifikat
 * Isolasi (nomor + file) wajib dilampirkan; jika Tidak, boleh dikosongkan.
 * IA bisa memanggil endpoint ini lebih dari sekali (mengubah evaluasi)
 * selama izin masih menunggu_penerbitan — file lama dianggap cukup bila
 * tidak ada file baru diunggah.
 */
class StoreWahIsolationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:IA + pengecekan penugasan di controller
    }

    public function rules(): array
    {
        $permit = $this->route('permit');
        $sudahAdaSertifikat = $permit && $permit->wah_isolasi_cert_file_path;

        return [
            'wah_isolasi_diperlukan' => ['required', 'boolean'],
            'wah_isolasi_cert_nomor' => ['required_if:wah_isolasi_diperlukan,1', 'nullable', 'string', 'max:50'],
            'wah_isolasi_cert_file'  => [
                'nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240',
                Rule::requiredIf(fn () => $this->boolean('wah_isolasi_diperlukan') && ! $sudahAdaSertifikat),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'wah_isolasi_diperlukan.required' => 'Pilih apakah Isolasi Energi diperlukan.',
            'wah_isolasi_cert_nomor.required_if' => 'Nomor Sertifikat Isolasi wajib diisi jika Isolasi Energi diperlukan.',
            'wah_isolasi_cert_file.required'     => 'File Sertifikat Isolasi wajib dilampirkan jika Isolasi Energi diperlukan (belum ada file tersimpan).',
        ];
    }
}
