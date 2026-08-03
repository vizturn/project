<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Manajemen akun pengguna.
 *
 * Pembagian wewenang:
 *   - SHE : mengaktifkan akun pendaftar baru & menetapkan/mengubah role.
 *   - ADM (ICT) : menonaktifkan akun, atau menghapus permanen (hanya bila
 *                 pengguna tidak memiliki izin terkait, demi menjaga integritas
 *                 data & jejak audit).
 *
 * Otorisasi kasar (role SHE/ADM) diterapkan lewat middleware pada route.
 */
class AccountController extends Controller
{
    /**
     * Daftar akun. Bisa difilter status (pending = menunggu aktivasi).
     */
    public function index(Request $request)
    {
        $q = User::query()->with('roles:id,kode_role,nama_role');

        if ($request->query('status') === 'pending') {
            $q->where('status_aktif', false);
        } elseif ($request->query('status') === 'aktif') {
            $q->where('status_aktif', true);
        }

        $users = $q->orderByDesc('created_at')->get()->map(fn ($u) => [
            'id'           => $u->id,
            'name'         => $u->name,
            'email'        => $u->email,
            'jabatan'      => $u->jabatan,
            'divisi'       => $u->divisi,
            'perusahaan'   => $u->perusahaan,
            'role_diminta' => $u->role_diminta,
            'status_aktif' => $u->status_aktif,
            'roles'        => $u->roles->pluck('kode_role'),
            'created_at'   => $u->created_at,
        ]);

        return response()->json(['data' => $users]);
    }

    /**
     * SHE menolak pendaftaran: hapus akun yang masih menunggu persetujuan.
     * Hanya berlaku untuk akun non-aktif (belum pernah dipakai), sehingga
     * tidak mungkin memiliki izin terkait.
     */
    public function reject(Request $request, User $user)
    {
        if ($user->status_aktif) {
            return response()->json([
                'message' => 'Akun sudah aktif dan tidak dapat ditolak. Gunakan nonaktifkan.',
            ], 422);
        }

        $nama = $user->name;
        $user->tokens()->delete();
        $user->roles()->detach();
        $user->delete();

        $this->catatAudit($request->user(), 'reject_account');

        return response()->json(['message' => "Pendaftaran {$nama} ditolak."]);
    }

    /**
     * SHE mengaktifkan akun & menetapkan role definitif.
     */
    public function activate(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => ['required', 'string', Rule::exists('roles', 'kode_role')],
        ]);

        $roleId = Role::where('kode_role', $data['role'])->value('id');
        $user->roles()->sync([$roleId]);
        $user->update(['status_aktif' => true]);

        $this->catatAudit($request->user(), 'activate_account', $user->id);

        return response()->json([
            'message' => "Akun {$user->name} diaktifkan sebagai {$data['role']}.",
        ]);
    }

    /**
     * ADM (ICT) menonaktifkan akun (data tetap tersimpan untuk audit).
     */
    public function deactivate(Request $request, User $user)
    {
        $user->update(['status_aktif' => false]);
        $user->tokens()->delete(); // cabut sesi aktif

        $this->catatAudit($request->user(), 'deactivate_account', $user->id);

        return response()->json(['message' => "Akun {$user->name} dinonaktifkan."]);
    }

    /**
     * ADM (ICT) menghapus akun permanen — hanya bila tidak ada izin terkait.
     */
    public function destroy(Request $request, User $user)
    {
        $terkait = $this->jumlahIzinTerkait($user);
        if ($terkait > 0) {
            return response()->json([
                'message' => "Akun tidak dapat dihapus permanen karena masih terkait {$terkait} izin. Gunakan nonaktifkan.",
            ], 422);
        }

        // Cegah menghapus diri sendiri.
        if ((int) $user->id === (int) $request->user()->id) {
            return response()->json(['message' => 'Tidak dapat menghapus akun sendiri.'], 422);
        }

        $nama = $user->name;
        $user->tokens()->delete();
        $user->roles()->detach();
        $user->delete();

        $this->catatAudit($request->user(), 'delete_account');

        return response()->json(['message' => "Akun {$nama} dihapus permanen."]);
    }

    /**
     * Hitung izin yang merujuk user (sebagai PA/AA/IA).
     */
    private function jumlahIzinTerkait(User $user): int
    {
        return \App\Models\Permit::query()
            ->where('performing_authority_id', $user->id)
            ->orWhere('approval_authority_id', $user->id)
            ->orWhere('issuing_authority_id', $user->id)
            ->count();
    }

    private function catatAudit(User $aktor, string $aksi, ?int $targetId = null): void
    {
        AuditLog::create([
            'user_id'    => $aktor->id,
            'aksi'       => $aksi,
            'entitas'    => 'users',
            'entitas_id' => $targetId,
        ]);
    }
}
