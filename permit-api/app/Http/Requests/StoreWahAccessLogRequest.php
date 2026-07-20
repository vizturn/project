<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Bagian 7 — Notifikasi Saat Memulai Bekerja di Ketinggian (khusus WAH).
 * PA mencatat jam naik dan/atau jam turun; boleh dicatat berkali-kali
 * selama izin berstatus AKTIF.
 */
class StoreWahAccessLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:PA + pengecekan pemilik di controller
    }

    public function rules(): array
    {
        return [
            'jam_naik'  => ['nullable', 'date_format:H:i'],
            'jam_turun' => ['nullable', 'date_format:H:i'],
            'catatan'   => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if (! $this->filled('jam_naik') && ! $this->filled('jam_turun')) {
                $v->errors()->add('jam_naik', 'Isi minimal salah satu: jam naik atau jam turun.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'jam_naik.date_format'  => 'Format jam naik tidak valid.',
            'jam_turun.date_format' => 'Format jam turun tidak valid.',
        ];
    }
}
