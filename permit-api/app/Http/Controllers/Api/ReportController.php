<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permit;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * Statistik personal per peran yang dimiliki pengguna yang login.
     *
     * Berbeda dari summary() yang global (khusus SHE/ADM), method ini
     * mengembalikan statistik izin yang TERKAIT dengan pengguna, dipecah
     * per peran agar tidak ambigu bila satu orang punya banyak peran.
     * Tiap peran difilter kolom authority-nya masing-masing:
     *   PA  -> performing_authority_id
     *   AA  -> approval_authority_id
     *   IA  -> issuing_authority_id
     *   PJ  -> cse_petugas_jaga_id (khusus izin CSE)
     *
     * Bentuk respons: { "PA": {total, by_status}, "IA": {...}, ... }
     * Hanya peran yang dimiliki pengguna yang disertakan.
     */
    public function mySummary(Request $request)
    {
        $user = $request->user();

        // Peta peran -> kolom filter di tabel permits.
        $petaPeran = [
            'PA' => 'performing_authority_id',
            'AA' => 'approval_authority_id',
            'IA' => 'issuing_authority_id',
            'PJ' => 'cse_petugas_jaga_id',
        ];

        $hasil = [];

        foreach ($petaPeran as $kodeRole => $kolom) {
            if (! $user->hasRole($kodeRole)) {
                continue;
            }

            $q = Permit::query()->where($kolom, $user->id);

            $total = (clone $q)->count();

            $byStatus = (clone $q)
                ->selectRaw('status, COUNT(*) AS jumlah')
                ->groupBy('status')
                ->pluck('jumlah', 'status');

            $hasil[$kodeRole] = [
                'total'     => $total,
                'by_status' => $byStatus,
            ];
        }

        return response()->json(['data' => $hasil]);
    }

    /** Rekap izin untuk evaluasi (opsional rentang tanggal from/to). */
    public function summary(Request $request)
    {
        $base = Permit::query();

        if ($request->filled('from')) {
            $base->whereDate('permits.created_at', '>=', $request->query('from'));
        }
        if ($request->filled('to')) {
            $base->whereDate('permits.created_at', '<=', $request->query('to'));
        }

        $total = (clone $base)->count();

        $byStatus = (clone $base)
            ->selectRaw('status, COUNT(*) AS jumlah')
            ->groupBy('status')
            ->pluck('jumlah', 'status');

        $byType = (clone $base)
            ->join('permit_types', 'permits.permit_type_id', '=', 'permit_types.id')
            ->selectRaw('permit_types.kode AS kode, COUNT(*) AS jumlah')
            ->groupBy('permit_types.kode')
            ->pluck('jumlah', 'kode');

        return response()->json([
            'data' => [
                'total'     => $total,
                'by_status' => $byStatus,
                'by_type'   => $byType,
            ],
        ]);
    }
}
