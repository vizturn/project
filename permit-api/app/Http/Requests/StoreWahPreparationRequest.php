<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bagian 3 — Persiapan (khusus WAH), diisi PA.
 * Mencakup: JSA (opsional), Scaffolding Certificate (wajib jika pakai perancah),
 * daftar pekerja di ketinggian, dan checklist peralatan khusus.
 * Guard status/kepemilikan ditangani di controller.
 */
class StoreWahPreparationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nomor_jsa' => ['nullable', 'string', 'max:50'],
            'jsa_file'  => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],

            'wah_menggunakan_perancah'   => ['required', 'boolean'],
            'wah_scaffolding_cert_nomor' => ['required_if:wah_menggunakan_perancah,1', 'nullable', 'string', 'max:50'],
            'wah_scaffolding_cert_file'  => ['required_if:wah_menggunakan_perancah,1', 'nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],

            // Daftar pekerja (Bagian 3) — minimal satu, nama wajib.
            'workers'                    => ['required', 'array', 'min:1'],
            'workers.*.nama_pekerja'     => ['required', 'string', 'max:150'],
            'workers.*.sudah_pelatihan'  => ['required', 'boolean'],

            // Peralatan khusus — checklist (array kode) + teks lainnya.
            'peralatan'                  => ['nullable', 'array'],
            'peralatan.*'                => ['string', 'max:50'],
            'peralatan_lainnya'          => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'jsa_file.mimes' => 'File JSA harus berformat PDF, Word, atau gambar.',
            'wah_scaffolding_cert_nomor.required_if' => 'Nomor Scaffolding Certificate wajib diisi jika menggunakan perancah.',
            'wah_scaffolding_cert_file.required_if'  => 'File Scaffolding Certificate wajib dilampirkan jika menggunakan perancah.',
            'workers.required'                => 'Minimal satu pekerja harus didaftarkan.',
            'workers.*.nama_pekerja.required' => 'Nama pekerja wajib diisi.',
        ];
    }
}
