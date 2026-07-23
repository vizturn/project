<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Bagian 3 — Persiapan (bagian PA, khusus CSE).
 * Petugas Jaga wajib merupakan pengguna terdaftar ber-role PJ agar ia dapat
 * masuk sistem dan mencatat keluar-masuk personel (Bagian 7) dengan jejak audit.
 */
class StoreCsePreparationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // RBAC via middleware role:PA + pengecekan pemilik di controller
    }

    public function rules(): array
    {
        return [
            'cse_petugas_jaga_id' => ['required', 'integer', 'exists:users,id'],
            'cse_alat_komunikasi' => ['nullable', 'string', 'max:100'],
            'peralatan'           => ['nullable', 'array'],
            'peralatan.*'         => ['string', 'max:50'],
            'peralatan_lainnya'   => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $id = $this->input('cse_petugas_jaga_id');

            if (! $id) {
                return;
            }

            $user = User::find($id);

            if (! $user || ! $user->status_aktif || ! $user->hasRole('PJ')) {
                $v->errors()->add('cse_petugas_jaga_id', 'Petugas Jaga harus pengguna aktif dengan peran PJ.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'cse_petugas_jaga_id.required' => 'Petugas Jaga wajib ditetapkan.',
        ];
    }
}
