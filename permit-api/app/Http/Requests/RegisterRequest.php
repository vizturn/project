<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi pendaftaran akun mandiri.
 * Akun yang terdaftar berstatus non-aktif sampai diaktifkan Departemen SHE.
 */
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // endpoint publik
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:150'],
            'email'        => ['required', 'email', 'max:150', 'unique:users,email'],
            'password'     => ['required', 'string', 'min:8', 'confirmed'],
            'jabatan'      => ['nullable', 'string', 'max:100'],
            'divisi'       => ['nullable', 'string', 'max:100'],
            'perusahaan'   => ['nullable', 'string', 'max:150'],
            // Role yang diminta harus salah satu kode role yang valid.
            'role_diminta' => ['required', 'string', Rule::exists('roles', 'kode_role')],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'         => 'Email sudah terdaftar.',
            'password.confirmed'   => 'Konfirmasi password tidak cocok.',
            'password.min'         => 'Password minimal 8 karakter.',
            'role_diminta.exists'  => 'Role yang diminta tidak valid.',
        ];
    }
}
