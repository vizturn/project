<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware RBAC berbasis tabel custom `roles` + `user_roles`
 * (bukan spatie/laravel-permission — lihat keputusan di CARA_PAKAI.md).
 *
 * Pemakaian di route (logika OR, salah satu role cukup):
 *   Route::middleware('role:AA')->group(...)
 *   Route::middleware('role:AA,IA')->group(...)   // AA atau IA
 *
 * Wajib dipasang SETELAH middleware 'auth:sanctum' pada grup route,
 * karena bergantung pada Auth::user() yang sudah ter-resolve.
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$rolesDiizinkan): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // Ambil kode_role user sekali saja (hindari query berulang per pengecekan).
        $kodeRoleUser = $user->roles()->pluck('kode_role')->all();

        $diizinkan = collect($rolesDiizinkan)
            ->contains(fn (string $kode) => in_array($kode, $kodeRoleUser, true));

        if (! $diizinkan) {
            return response()->json([
                'message' => 'Anda tidak memiliki peran yang diizinkan untuk mengakses resource ini.',
                'required_roles' => $rolesDiizinkan,
            ], 403);
        }

        return $next($request);
    }
}
