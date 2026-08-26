<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permit;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Log izin harian (khusus SHE/ADM via middleware role di routes/api.php).
 *
 * Menampilkan izin-izin yang MASUK (diajukan) pada rentang tanggal
 * tertentu — siapa PA yang mengajukan, serta AA & IA yang dituju untuk
 * menerima/memproses izin tersebut. "Tanggal masuk" memakai created_at
 * izin, konsisten dengan konvensi yang sudah dipakai di SendWeeklyRecap
 * (rekap mingguan) dan ReportController::dataDashboard() ('bulan_ini').
 *
 * Struktur sengaja dibuat sejajar dengan AuditLogController: index() untuk
 * tabel di halaman, export() untuk unduhan CSV (bisa dibuka Excel) dengan
 * filter yang sama. Bedanya di sini filter tanggal WAJIB (default: hari
 * ini) karena fitur ini memang berbasis "per hari", bukan log bebas tanggal.
 */
class PermitDailyLogController extends Controller
{
    /** Label status Indonesia untuk kolom CSV — meniru STATUS_META di frontend (lib/status.js). */
    private const LABEL_STATUS = [
        'draft'                 => 'Draft',
        'menunggu_approval'     => 'Menunggu Approval',
        'disetujui'             => 'Disetujui',
        'ditolak'               => 'Ditolak',
        'menunggu_persiapan_pa' => 'Menunggu Persiapan PA',
        'menunggu_penerbitan'   => 'Menunggu Penerbitan',
        'menunggu_penerimaan'   => 'Menunggu Penerimaan PA',
        'aktif'                 => 'Aktif',
        'ditunda'               => 'Ditunda',
        'kadaluarsa'            => 'Kadaluarsa',
        'selesai'               => 'Selesai',
        'closed'                => 'Closed',
    ];

    /** Daftar izin yang masuk pada rentang tanggal (default: hari ini). */
    public function index(Request $request)
    {
        $query = $this->buildQuery($request);

        return response()->json([
            'data' => $query->limit(1000)->get(),
        ]);
    }

    /** Export daftar izin (sesuai filter yang sama) ke file CSV — bisa dibuka langsung di Excel. */
    public function export(Request $request): StreamedResponse
    {
        $query    = $this->buildQuery($request);
        $namaFile = 'log-izin-harian-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');

            // BOM UTF-8 agar karakter tampil benar di Excel.
            fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($out, [
                'Tanggal Masuk', 'Nomor Izin', 'Jenis Izin', 'Lokasi',
                'PA (Pengaju)', 'AA (Penerima Approval)', 'IA (Penerima Penerbitan)', 'Status',
            ]);

            // Ambil bertahap (chunk) agar hemat memori bila data banyak (mis. filter 1 bulan).
            $query->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $p) {
                    fputcsv($out, [
                        optional($p->created_at)->format('d/m/Y H:i') ?? '',
                        $p->nomor_izin,
                        $p->permitTypes->pluck('kode')->implode(', '),
                        $p->lokasi,
                        $p->performingAuthority->name ?? '-',
                        $p->approvalAuthority->name ?? '-',
                        $p->issuingAuthority->name ?? '-',
                        self::LABEL_STATUS[$p->status] ?? $p->status,
                    ]);
                }
            });

            fclose($out);
        }, $namaFile, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * Query dasar + filter, dipakai bersama oleh index() dan export().
     *
     * Filter tanggal: tanggal_mulai & tanggal_selesai (Y-m-d), keduanya
     * OPSIONAL — kalau tidak dikirim, default ke HARI INI. Frontend
     * menghitung rentang preset (hari ini / 1 minggu / 1 bulan) lalu
     * mengirim tanggal_mulai & tanggal_selesai eksplisit.
     */
    private function buildQuery(Request $request)
    {
        $data = $request->validate([
            'tanggal_mulai'   => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date'],
        ]);

        $mulai   = $data['tanggal_mulai'] ?? now()->toDateString();
        $selesai = $data['tanggal_selesai'] ?? now()->toDateString();

        return Permit::with([
                'permitTypes:id,kode,nama',
                'performingAuthority:id,name',
                'approvalAuthority:id,name',
                'issuingAuthority:id,name',
            ])
            ->whereDate('created_at', '>=', $mulai)
            ->whereDate('created_at', '<=', $selesai)
            ->orderBy('created_at');
    }
}
