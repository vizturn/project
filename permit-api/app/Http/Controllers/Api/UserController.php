<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Daftar user aktif berdasarkan kode role (mis. ?role=AA).
     * Hanya mengekspos id, nama, dan jabatan — tidak ada data sensitif.
     */
    public function index(Request $request)
    {
        $request->validate([
            'role' => ['required', 'string', 'exists:roles,kode_role'],
        ]);

        $users = User::where('status_aktif', true)
            ->whereHas('roles', fn ($q) => $q->where('kode_role', $request->query('role')))
            ->orderBy('name')
            ->get(['id', 'name', 'jabatan']);

        return response()->json(['data' => $users]);
    }
}
