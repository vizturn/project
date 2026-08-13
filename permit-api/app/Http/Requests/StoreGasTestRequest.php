<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGasTestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:AGT,IA
    }

    public function rules(): array
    {
        return [
            'oksigen_persen' => ['required', 'numeric', 'between:0,100'],
            'lel_persen'     => ['required', 'numeric', 'min:0'],
            'co_ppm'         => ['nullable', 'numeric', 'min:0'],
            'h2s_ppm'        => ['nullable', 'numeric', 'min:0'],
            'fase'           => ['nullable', 'in:awal,lanjutan'],
            // Nama petugas yang benar-benar melaksanakan pengetesan di lapangan
            // (ditulis manual, bisa beda dari akun yang login menginput data).
            'petugas_nama'   => ['required', 'string', 'max:150'],
            // Dokumentasi foto pengetesan — opsional, format gambar umum, maks 5 MB.
            'foto'           => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }
}
