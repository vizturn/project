<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bagian 7 — Catatan masuk/keluar ruang terbatas (CSE).
 * Jam keluar boleh dikosongkan saat personel baru masuk, lalu dilengkapi
 * ketika personel keluar.
 */
class StoreCseAccessLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Pengecekan Petugas Jaga / PA pemilik dilakukan di controller
    }

    public function rules(): array
    {
        return [
            'nama_pekerja' => ['required', 'string', 'max:150'],
            'tanggal'      => ['required', 'date'],
            'jam_masuk'    => ['required', 'date_format:H:i'],
            'jam_keluar'   => ['nullable', 'date_format:H:i', 'after:jam_masuk'],
            'catatan'      => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'nama_pekerja.required' => 'Nama personel yang masuk wajib diisi.',
            'jam_masuk.required'    => 'Jam masuk wajib diisi.',
            'jam_keluar.after'      => 'Jam keluar harus setelah jam masuk.',
        ];
    }
}
