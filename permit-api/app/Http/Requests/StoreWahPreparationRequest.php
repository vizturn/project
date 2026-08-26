<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Bagian 3 — Persiapan (khusus WAH). Dipakai DUA kali:
 *  - PA mengisi pertama kali (WahPreparationController::store)
 *  - IA meninjau/mengedit (WahPreparationController::update)
 * Mencakup: JSA (opsional), Scaffolding Certificate (wajib jika pakai perancah
 * DAN belum ada file tersimpan sebelumnya), daftar pekerja di ketinggian, dan
 * checklist peralatan khusus. Guard status/kepemilikan ditangani di controller.
 */
class StoreWahPreparationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Route-model binding {permit} sudah resolve saat validasi form request
        // berjalan, jadi aman dipakai di sini untuk cek apakah file lama sudah ada
        // (relevan saat IA mengedit lewat update() tanpa mengunggah ulang file).
        $permit = $this->route('permit');
        $sudahAdaScaffoldingCert = $permit && $permit->wah_scaffolding_cert_file_path;

        return [
            'nomor_jsa' => ['nullable', 'string', 'max:50'],
            'jsa_file'  => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'],

            'wah_menggunakan_perancah'   => ['required', 'boolean'],
            'wah_scaffolding_cert_nomor' => ['required_if:wah_menggunakan_perancah,1', 'nullable', 'string', 'max:50'],
            'wah_scaffolding_cert_file'  => [
                'nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240',
                Rule::requiredIf(fn () => $this->boolean('wah_menggunakan_perancah') && ! $sudahAdaScaffoldingCert),
            ],

            // Daftar pekerja (Bagian 3) — minimal satu, nama wajib.
            // 'id' opsional: dikirim FE untuk baris pekerja yang sudah ada
            // (hasil tinjau IA) supaya file sertifikat lama tidak hilang saat
            // submit ulang — lihat WahPreparationController::syncWorkers().
            'workers'                       => ['required', 'array', 'min:1'],
            'workers.*.id'                  => ['nullable', 'integer'],
            'workers.*.nama_pekerja'        => ['required', 'string', 'max:150'],
            'workers.*.sudah_pelatihan'     => ['required', 'boolean'],
            'workers.*.sertifikat_pelatihan_file' => [
                'nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240',
            ],

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
            'wah_scaffolding_cert_file.required'     => 'File Scaffolding Certificate wajib dilampirkan jika menggunakan perancah (belum ada file tersimpan).',
            'workers.required'                => 'Minimal satu pekerja harus didaftarkan.',
            'workers.*.nama_pekerja.required' => 'Nama pekerja wajib diisi.',
        ];
    }

    /**
     * Validasi tambahan: sertifikat pelatihan wajib ada (baru diunggah, atau
     * sudah tersimpan sebelumnya) untuk tiap pekerja yang sudah_pelatihan-nya
     * dicentang Ya. Dicek manual (bukan lewat required_if array biasa) karena
     * "sudah ada file lama" bergantung pada `id` pekerja di database, bukan
     * cuma nilai lain di request.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $permit = $this->route('permit');
            $fileLamaPerId = $permit
                ? $permit->wahWorkers()->pluck('sertifikat_pelatihan_file_path', 'id')
                : collect();

            foreach ((array) $this->input('workers', []) as $i => $w) {
                $sudahPelatihan = filter_var($w['sudah_pelatihan'] ?? false, FILTER_VALIDATE_BOOLEAN);
                if (! $sudahPelatihan) {
                    continue;
                }

                $adaFileBaru = $this->hasFile("workers.$i.sertifikat_pelatihan_file");
                $id = $w['id'] ?? null;
                $adaFileLama = $id && filled($fileLamaPerId->get((int) $id));

                if (! $adaFileBaru && ! $adaFileLama) {
                    $validator->errors()->add(
                        "workers.$i.sertifikat_pelatihan_file",
                        'Sertifikat pelatihan wajib dilampirkan untuk pekerja yang sudah mengikuti pelatihan.'
                    );
                }
            }
        });
    }
}
