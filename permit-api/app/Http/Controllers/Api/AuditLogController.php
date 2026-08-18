<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    /**
     * Daftar audit log dengan filter opsional (khusus SHE/ADM via middleware).
     * Filter: tanggal_mulai, tanggal_selesai (Y-m-d), user_id, aksi.
     */
    public function index(Request $request)
    {
        $query = $this->buildQuery($request);

        return response()->json([
            'data' => $query->limit(500)->get(),
        ]);
    }

    /**
     * Export audit log (sesuai filter yang sama) ke file CSV.
     * CSV bisa dibuka langsung di Excel. Data JSON diringkas agar mudah dibaca.
     */
    public function export(Request $request): StreamedResponse
    {
        $query = $this->buildQuery($request);
        $namaFile = 'audit-log-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');

            // BOM UTF-8 agar karakter (mis. panah, aksen) tampil benar di Excel.
            fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));

            // Header kolom.
            fputcsv($out, ['Waktu', 'Pengguna', 'Aksi', 'Entitas', 'ID Entitas', 'Perubahan']);

            // Ambil bertahap (chunk) agar hemat memori bila data banyak.
            $query->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $log) {
                    fputcsv($out, [
                        optional($log->logged_at)->format('d/m/Y H:i:s') ?? '',
                        $log->user->name ?? 'sistem',
                        $log->aksi,
                        $log->entitas,
                        $log->entitas_id ?? '',
                        $this->ringkasPerubahan($log->data_lama, $log->data_baru),
                    ]);
                }
            });

            fclose($out);
        }, $namaFile, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /** Query dasar + filter, dipakai bersama oleh index() dan export(). */
    private function buildQuery(Request $request)
    {
        $data = $request->validate([
            'tanggal_mulai'   => ['nullable', 'date'],
            'tanggal_selesai' => ['nullable', 'date'],
            'user_id'         => ['nullable', 'integer', 'exists:users,id'],
            'aksi'            => ['nullable', 'string', 'max:50'],
        ]);

        $query = AuditLog::with('user:id,name')->latest('id');

        if (! empty($data['tanggal_mulai'])) {
            $query->whereDate('logged_at', '>=', $data['tanggal_mulai']);
        }
        if (! empty($data['tanggal_selesai'])) {
            $query->whereDate('logged_at', '<=', $data['tanggal_selesai']);
        }
        if (! empty($data['user_id'])) {
            $query->where('user_id', $data['user_id']);
        }
        if (! empty($data['aksi'])) {
            $query->where('aksi', $data['aksi']);
        }

        return $query;
    }

    /**
     * Ringkas data_lama & data_baru (JSON) jadi teks mudah dibaca,
     * mis. "status: draft -> menunggu_approval; durasi: 5 -> 8".
     */
    private function ringkasPerubahan($lama, $baru): string
    {
        $lama = is_array($lama) ? $lama : (json_decode($lama ?? '[]', true) ?: []);
        $baru = is_array($baru) ? $baru : (json_decode($baru ?? '[]', true) ?: []);

        $keys = array_unique(array_merge(array_keys($lama), array_keys($baru)));
        $bagian = [];

        foreach ($keys as $k) {
            $l = $lama[$k] ?? null;
            $b = $baru[$k] ?? null;
            if ($l === $b) {
                continue;
            }
            $lStr = is_scalar($l) ? (string) $l : json_encode($l);
            $bStr = is_scalar($b) ? (string) $b : json_encode($b);
            $bagian[] = "{$k}: " . ($lStr === '' ? '(kosong)' : $lStr) . ' -> ' . ($bStr === '' ? '(kosong)' : $bStr);
        }

        return implode('; ', $bagian);
    }
}
