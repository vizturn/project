<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * STEP 27 — Bagian 4: Referensi Pendukung (dilengkapi oleh IA).
 * Semua field boleh kosong, tetapi bagian ini WAJIB disubmit sebelum penerbitan
 * (sebagai bukti IA telah meninjau referensi pendukung).
 */
class StoreReferenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:IA
    }

    public function rules(): array
    {
        return [
            'ref_permit_cse'              => ['nullable', 'string', 'max:50'],
            'ref_permit_wah'              => ['nullable', 'string', 'max:50'],
            'cert_isolation'              => ['nullable', 'string', 'max:50'],
            'cert_scaffolding'            => ['nullable', 'string', 'max:50'],
            'cert_excavation'             => ['nullable', 'string', 'max:50'],
            'sistem_safety_dinonaktifkan' => ['nullable', 'string', 'max:1000'],
            'referensi_lainnya'           => ['nullable', 'string', 'max:1000'],
        ];
    }
}
