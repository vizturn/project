<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Bagian 5/6 — Penerbitan oleh IA.
 * `tanggal`/`jam` OPSIONAL: izin WAH mengirim keduanya (IA menulis tanggal
 * & jam penerbitan secara manual); izin HWP/CWP/CSE tidak mengirim apa pun
 * dan tetap memakai waktu saat tombol ditekan (now()), sama seperti sebelumnya.
 */
class IssuePermitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:IA
    }

    public function rules(): array
    {
        return [
            'tanggal' => ['nullable', 'required_with:jam', 'date_format:Y-m-d'],
            'jam'     => ['nullable', 'required_with:tanggal', 'date_format:H:i'],
        ];
    }
}
