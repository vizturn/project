<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blokir akses jika akun user sudah dinonaktifkan (status_aktif = false),
 * walau token Sanctum-nya masih valid — mis. karyawan resign/dipindah tugas
 * tapi token lama belum kedaluwarsa. Tanpa middleware ini, menonaktifkan
 * user dari sisi HR/SSO tidak akan langsung mencabut akses API-nya.
 *
 * Pasang setelah 'auth:sanctum', sebelum middleware 'role:...'.
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->status_aktif) {
            // Cabut token yang sedang dipakai supaya tidak bisa dipakai lagi.
            $user->currentAccessToken()?->delete();

            return response()->json([
                'message' => 'Akun Anda tidak aktif. Hubungi Departemen SHE/Administrator.',
            ], 403);
        }

        return $next($request);
    }
}
