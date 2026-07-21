<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bagian 3 — Persiapan (bagian PA, khusus WAH).
 * JSA (nomor + file) SELALU opsional. Scaffolding Certificate (nomor +
 * file) wajib HANYA jika PA mencentang "menggunakan perancah".
 *
 * Ditambahkan (menutup sisa formulir kertas WAH Bagian 3):
 *  - Nama petugas pengawas keselamatan & peralatan komunikasi yang digunakan.
 *  - Daftar pekerja yang diizinkan bekerja di ketinggian, masing-masing
 *    dengan status "Telah Mengikuti Pelatihan Bekerja di Ketinggian" (Ya/Tidak).
 *  - Checklist peralatan khusus yang diperlukan (harness, lanyard, dst).
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

            'wah_menggunakan_perancah'   => ['required', 'boolean'],
            'wah_scaffolding_cert_nomor' => ['required_if:wah_menggunakan_perancah,1', 'nullable', 'string', 'max:50'],
            'wah_scaffolding_cert_file'  => ['required_if:wah_menggunakan_perancah,1', 'nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],

            // Petugas pengawas & peralatan komunikasi.
            'wah_nama_petugas_pengawas' => ['required', 'string', 'max:100'],
            'wah_peralatan_komunikasi'  => ['nullable', 'string', 'max:100'],

            // Daftar pekerja yang diizinkan bekerja di ketinggian (min. 1, form UI menampilkan 4-5 baris).
            'pekerja'                    => ['required', 'array', 'min:1', 'max:20'],
            'pekerja.*.nama'             => ['required', 'string', 'max:100'],
            'pekerja.*.telah_pelatihan'  => ['required', 'boolean'],

            // Checklist peralatan khusus (Bagian 3): semua wajib dicentang/tidak agar status IA jelas.
            'alat_full_body_harness' => ['required', 'boolean'],
            'alat_double_lanyard'    => ['required', 'boolean'],
            'alat_anchor_point'      => ['required', 'boolean'],
            'alat_barrier'           => ['required', 'boolean'],
            'alat_medic_kit'         => ['required', 'boolean'],
            'alat_ambulance'         => ['required', 'boolean'],
            'alat_lainnya'           => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'jsa_file.mimes' => 'File JSA harus berformat PDF, Word, atau gambar.',
            'wah_scaffolding_cert_nomor.required_if' => 'Nomor Scaffolding Certificate wajib diisi jika menggunakan perancah.',
            'wah_scaffolding_cert_file.required_if'  => 'File Scaffolding Certificate wajib dilampirkan jika menggunakan perancah.',
            'wah_nama_petugas_pengawas.required' => 'Nama petugas pengawas keselamatan wajib diisi.',
            'pekerja.required' => 'Minimal satu pekerja yang diizinkan bekerja di ketinggian harus diisi.',
            'pekerja.*.nama.required' => 'Nama pekerja wajib diisi.',
            'pekerja.*.telah_pelatihan.required' => 'Status pelatihan bekerja di ketinggian (Ya/Tidak) wajib dipilih untuk setiap pekerja.',
        ];
    }
}
