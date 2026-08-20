<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
     *
     * Bentuk respons: { "PA": {total, by_status}, "IA": {...}, ... }
     * Hanya peran yang dimiliki pengguna yang disertakan.
     */
    public function mySummary(Request $request)
    {
        $user = $request->user();

        // Peta peran -> kolom filter di tabel permits.
        // Catatan: Petugas Jaga (PJ) tidak lagi punya statistik personal karena
        // kini dicatat sebagai nama bebas, bukan akun pengguna.
        $petaPeran = [
            'PA' => 'performing_authority_id',
            'AA' => 'approval_authority_id',
            'IA' => 'issuing_authority_id',
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

        return response()->json([
            'data'      => $hasil,
            'dashboard' => $this->dataDashboard($user),
        ]);
    }

    /**
     * Data pendukung tampilan dashboard: metrik ringkas, distribusi jenis izin,
     * daftar izin yang mendekati batas waktu, serta izin terbaru.
     *
     * Seluruh data dibatasi pada izin yang TERKAIT dengan pengguna sesuai
     * perannya (PA/AA/IA). Untuk peran pemantau (SHE/ADM) seluruh izin dihitung.
     */
    private function dataDashboard($user): array
    {
        $q = Permit::query();

        // Batasi menurut peran. SHE dan ADM memantau seluruh izin.
        if (! ($user->hasRole('SHE') || $user->hasRole('ADM'))) {
            $q->where(function ($sub) use ($user) {
                if ($user->hasRole('PA')) $sub->orWhere('performing_authority_id', $user->id);
                if ($user->hasRole('AA')) $sub->orWhere('approval_authority_id', $user->id);
                if ($user->hasRole('IA')) $sub->orWhere('issuing_authority_id', $user->id);
                if ($user->hasRole('AGT')) {
                    $sub->orWhereHas('gasTests', fn ($g) => $g->where('agt_id', $user->id));
                }
            });
        }

        // Status yang dianggap "menunggu tindakan" (belum aktif, belum final).
        $menunggu = [
            'menunggu_approval', 'disetujui',
            'menunggu_persiapan_pa', 'menunggu_penerbitan', 'menunggu_penerimaan',
        ];

        $metrik = [
            'aktif'          => (clone $q)->where('status', 'aktif')->count(),
            'menunggu'       => (clone $q)->whereIn('status', $menunggu)->count(),
            'mendekati_batas'=> (clone $q)->where('status', 'aktif')
                                   ->whereNotNull('tgl_kadaluarsa')
                                   ->whereBetween('tgl_kadaluarsa', [now(), now()->addHours(12)])
                                   ->count(),
            'total'          => (clone $q)->count(),
            'selesai'        => (clone $q)->whereIn('status', ['selesai', 'closed'])->count(),
            'bulan_ini'      => (clone $q)->whereBetween('created_at', [now()->startOfMonth(), now()])->count(),
        ];

        // Distribusi jenis izin (satu izin dapat mencakup lebih dari satu jenis).
        $idIzin = (clone $q)->pluck('id');
        $distribusi = [];
        if ($idIzin->isNotEmpty()) {
            $distribusi = DB::table('permit_permit_type')
                ->join('permit_types', 'permit_types.id', '=', 'permit_permit_type.permit_type_id')
                ->whereIn('permit_permit_type.permit_id', $idIzin)
                ->selectRaw('permit_types.kode, permit_types.nama, COUNT(*) AS jumlah')
                ->groupBy('permit_types.kode', 'permit_types.nama')
                ->orderByDesc('jumlah')
                ->get()
                ->toArray();
        }

        // Izin aktif yang paling dekat batas waktunya.
        $mendekatiBatas = (clone $q)->where('status', 'aktif')
            ->whereNotNull('tgl_kadaluarsa')
            ->orderBy('tgl_kadaluarsa')
            ->limit(4)
            ->get(['id', 'nomor_izin', 'lokasi', 'tgl_kadaluarsa']);

        // Izin terbaru beserta jenis dan pengajunya.
        $terbaru = (clone $q)->with(['permitTypes:id,kode', 'performingAuthority:id,name'])
            ->latest('id')->limit(5)
            ->get(['id', 'nomor_izin', 'lokasi', 'status', 'created_at', 'performing_authority_id']);

        return [
            'metrik'          => $metrik,
            'distribusi'      => $distribusi,
            'mendekati_batas' => $mendekatiBatas,
            'terbaru'         => $terbaru,
        ];
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
