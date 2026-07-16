<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * STEP 27 — Bagian 7: Penerimaan PTW oleh PA.
 * PA menyatakan telah membaca & memahami seluruh kondisi izin
 * serta menerima tanggung jawab pelaksanaan pekerjaan.
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
