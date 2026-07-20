<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Validasi untuk MENGUBAH isi izin yang masih berstatus draft.
 * Aturan field identik dengan StorePermitRequest — yang membedakan hanya
 * konteks pemakaian (update, bukan create). Guard status draft & kepemilikan
 * PA ditangani di controller, bukan di sini.
 */
class UpdatePermitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:PA; guard draft+pemilik di controller
    }

    public function rules(): array
    {
        return [
            'permit_type_ids'       => ['required', 'array', 'min:1'],
            'permit_type_ids.*'     => ['integer', 'distinct', 'exists:permit_types,id'],
            'screening_id'          => ['nullable', 'integer', 'exists:screenings,id'],
            'wo_id'                 => ['nullable', 'integer', 'exists:work_orders,id'],
            'equipment_id'          => ['nullable', 'integer', 'exists:equipment,id'],
            'lokasi'                => ['required', 'string', 'max:150'],
            'deskripsi_pekerjaan'   => ['required', 'string'],
            'durasi'                => ['nullable', 'string', 'max:50'],
            'approval_authority_id' => ['required', 'integer', 'exists:users,id'],
            'issuing_authority_id'  => ['required', 'integer', 'exists:users,id'],
        ];
    }

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
            return;
        }

        $user = User::find($id);

        if (! $user || ! $user->status_aktif || ! $user->hasRole($kodeRole)) {
            $v->errors()->add($field, "Pengguna yang dipilih bukan {$label} ({$kodeRole}) yang aktif.");
        }
    }

    public function messages(): array
    {
        return [
            'permit_type_ids.required'       => 'Minimal satu jenis izin harus dipilih.',
            'permit_type_ids.min'            => 'Minimal satu jenis izin harus dipilih.',
            'approval_authority_id.required' => 'Approval Authority (AA) wajib dipilih.',
            'issuing_authority_id.required'  => 'Issuing Authority (IA) wajib dipilih.',
        ];
    }
}