<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * STEP 27 — Bagian 7: Penerimaan PTW oleh PA (Bagian 6 untuk formulir WAH).
 * PA menyatakan telah membaca & memahami seluruh kondisi izin
 * serta menerima tanggung jawab pelaksanaan pekerjaan.
 *
 * `tanggal`/`jam` OPSIONAL: izin WAH mengirim keduanya (PA menulis tanggal
 * & jam penerimaan secara manual); izin HWP/CWP/CSE tidak mengirim apa pun
 * dan tetap memakai waktu saat tombol ditekan (now()), sama seperti sebelumnya.
 */
class AcceptPermitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:PA
    }

    public function rules(): array
    {
        return [
            'pernyataan' => ['required', 'accepted'],
            'tanggal'    => ['nullable', 'required_with:jam', 'date_format:Y-m-d'],
            'jam'        => ['nullable', 'required_with:tanggal', 'date_format:H:i'],
        ];
    }

    public function messages(): array
    {
        return [
            'pernyataan.required' => 'Anda harus menyatakan telah membaca dan memahami izin ini.',
            'pernyataan.accepted' => 'Anda harus menyatakan telah membaca dan memahami izin ini.',
        ];
    }
}
