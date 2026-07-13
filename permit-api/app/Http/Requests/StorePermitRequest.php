<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StorePermitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:PA
    }

    public function rules(): array
    {
        return [
            // STEP 25 — satu izin bisa mencakup beberapa jenis sekaligus.
            'permit_type_ids'       => ['required', 'array', 'min:1'],
            'permit_type_ids.*'     => ['integer', 'distinct', 'exists:permit_types,id'],
            'screening_id'          => ['nullable', 'integer', 'exists:screenings,id'],
            'wo_id'                 => ['nullable', 'integer', 'exists:work_orders,id'],
            'equipment_id'          => ['nullable', 'integer', 'exists:equipment,id'],
            'lokasi'                => ['required', 'string', 'max:150'],
            'deskripsi_pekerjaan'   => ['required', 'string'],
            'durasi'                => ['nullable', 'string', 'max:50'],

            // STEP 24 — penugasan: PA menentukan AA & IA yang dituju.
            'approval_authority_id' => ['required', 'integer', 'exists:users,id'],
            'issuing_authority_id'  => ['required', 'integer', 'exists:users,id'],
        ];
    }

    /**
     * Pastikan user yang ditunjuk BENAR-BENAR memegang peran tersebut,
     * dan akunnya aktif. Tanpa ini, PA bisa menunjuk user sembarangan.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $this->pastikanBerperan($v, 'approval_authority_id', 'AA', 'Approval Authority');
            $this->pastikanBerperan($v, 'issuing_authority_id', 'IA', 'Issuing Authority');
        });
    }

    private function pastikanBerperan(Validator $v, string $field, string $kodeRole, string $label): void
    {
        $id = $this->input($field);

        if (! $id) {
            return; // sudah ditangani rule 'required'
        }

        $user = User::find($id);

        if (! $user || ! $user->status_aktif || ! $user->hasRole($kodeRole)) {
            $v->errors()->add($field, "Pengguna yang dipilih bukan {$label} ({$kodeRole}) yang aktif.");
        }
    }

    public function messages(): array
    {
        return [
            'permit_type_ids.required'      => 'Minimal satu jenis izin harus dipilih.',
            'permit_type_ids.min'           => 'Minimal satu jenis izin harus dipilih.',
            'approval_authority_id.required' => 'Approval Authority (AA) wajib dipilih.',
            'issuing_authority_id.required'  => 'Issuing Authority (IA) wajib dipilih.',
        ];
    }
}
