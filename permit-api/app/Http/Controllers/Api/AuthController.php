<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Login dan terbitkan Bearer token (Sanctum personal access token).
     * Sesuai diagram arsitektur: Auth Context (frontend) menyimpan token ini
     * lalu mengirimkannya lewat header Authorization: Bearer <token>.
     */
    public function login(LoginRequest $request)
    {
        $data = $request->validated();

        $user = User::where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], 422);
        }

        if (! $user->status_aktif) {
            return response()->json([
                'message' => 'Akun Anda tidak aktif. Hubungi Departemen SHE/Administrator.',
            ], 403);
        }

        // Nama token dibedakan per device/browser supaya bisa di-audit/dicabut satu-satu.
        $namaToken = $request->input('device_name', 'api-token');
        $token = $user->createToken($namaToken)->plainTextToken;

        $this->catatAudit($user, 'login');

        return response()->json([
            'user' => $this->formatUser($user),
            'token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Logout: cabut token yang sedang dipakai request ini saja
     * (bukan semua device/token milik user).
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        $user->currentAccessToken()?->delete();

        $this->catatAudit($user, 'logout');

        return response()->json([
            'message' => 'Berhasil logout.',
        ]);
    }

    /**
     * Profil user yang sedang login + daftar role-nya.
     * Berguna untuk frontend menentukan menu/akses berdasarkan role.
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $this->formatUser($request->user()),
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'jabatan' => $user->jabatan,
            'status_aktif' => $user->status_aktif,
            'roles' => $user->roles()->pluck('kode_role'),
        ];
    }

    private function catatAudit(User $user, string $aksi): void
    {
        AuditLog::create([
            'user_id' => $user->id,
            'aksi' => $aksi,
            'entitas' => 'users',
            'entitas_id' => $user->id,
            'logged_at' => now(),
        ]);
    }
}
