<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Permit;
use App\Models\PermitStatusHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Pusat logika nomor izin & pencatatan transisi status
 * (agar konsisten: setiap transisi menulis permit_status_history + audit_logs).
 */
class PermitService
{
    /**
     * Nomor izin: {URUT}/PTW/{TAHUN}  — mis. 001/PTW/2026
     *
     * SATU deret berurutan untuk SEMUA jenis izin, direset tiap tahun.
     *
     * Format lama memakai deret terpisah per jenis (HWP/2026/0001,
     * CWP/2026/0001, PTW/2026/0001 untuk izin gabungan). Akibatnya nomor
     * "0001" bisa muncul tiga kali di tahun yang sama, dan pengguna tidak bisa
     * menyimpulkan apa pun dari nomor — izin ke-50 bisa saja bernomor 0007.
     * Format baru mengikuti kebiasaan penomoran surat perusahaan: urut dulu,
     * lalu kode, lalu tahun. Jenis izin tetap terbaca dari kolom permit_types,
     * dan tercetak jelas di lembar PTW-nya sendiri.
     */
    public function generateNomorIzin(): string
    {
        return $this->nomorBerurutan();
    }

    /**
     * Mengambil nomor urut berikutnya secara aman dari balapan (race condition).
     *
     * `lockForUpdate()` mengunci baris penghitung tahun berjalan sampai
     * transaksi selesai, sehingga dua pengajuan yang datang bersamaan dilayani
     * berurutan — bukan sama-sama membaca angka yang sama lalu bentrok di
     * constraint unique `permits.nomor_izin`. Lihat catatan lengkap di
     * migration create_permit_number_counters_table.
     *
     * Pemanggil (PermitController::store & update) sudah membungkus prosesnya
     * dalam DB::transaction, jadi transaction di sini menjadi savepoint
     * bersarang dan kuncinya ikut dilepas saat transaksi terluar selesai.
     */
    private function nomorBerurutan(): string
    {
        $tahun = (int) now()->year;

        $urut = DB::transaction(function () use ($tahun) {
            $baris = DB::table('permit_number_counters')
                ->where('tahun', $tahun)
                ->lockForUpdate()
                ->first();

            // Tahun baru (mis. pergantian ke 2027) belum punya baris penghitung.
            if (! $baris) {
                DB::table('permit_number_counters')->insert([
                    'tahun'       => $tahun,
                    'last_number' => 0,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);

                $baris = DB::table('permit_number_counters')
                    ->where('tahun', $tahun)
                    ->lockForUpdate()
                    ->first();
            }

            $berikutnya = (int) $baris->last_number + 1;

            DB::table('permit_number_counters')
                ->where('tahun', $tahun)
                ->update([
                    'last_number' => $berikutnya,
                    'updated_at'  => now(),
                ]);

            return $berikutnya;
        });

        // %03d memberi padding minimal 3 digit (001..999) dan meluas sendiri
        // begitu melewati 999 menjadi 1000 — tidak ada batas atas buatan.
        return sprintf('%03d/PTW/%d', $urut, $tahun);
    }

    /** Kumpulan kode jenis izin (HWP, CWP, CSE, WAH) yang melekat pada satu izin. */
    public function jenisIzin(Permit $permit): \Illuminate\Support\Collection
    {
        $kode = $permit->permitTypes()->pluck('permit_types.kode');

        // Kompatibel mundur: izin lama belum punya baris pivot permitTypes.
        if ($kode->isEmpty() && $permit->permitType) {
            $kode = collect([$permit->permitType->kode]);
        }

        return $kode;
    }

    public function butuhReferensiPendukung(Permit $permit): bool
    {
        return $this->jenisIzin($permit)->intersect(['HWP', 'CWP'])->isNotEmpty();
    }

    /**
     * Izin GABUNGAN (mis. HWP + WAH, atau CSE + WAH) mengharuskan PA melengkapi
     * SEMUA bagian Bagian 3 yang relevan sebelum izin boleh lanjut ke tahap IA
     * (menunggu_penerbitan). Dipakai HazardController & WahPreparationController
     * agar salah satu form yang disubmit duluan tidak langsung "mendorong" izin
     * ke IA sebelum form lain yang wajib ikut terisi.
     *
     * Catatan timing: fungsi ini dipanggil DI TENGAH transaksi store (sebelum
     * penanda *_diisi_at final di-set), jadi kelengkapan tiap jenis dicek lewat
     * data mentahnya yang sudah tersimpan saat itu:
     *   - HWP/CWP -> tingkat_risiko (diisi bersama identifikasi bahaya)
     *   - WAH     -> wah_persiapan_diisi_at
     *   - CSE     -> cse_persiapan_diisi_at
     */
    public function bagian3Selesai(Permit $permit): bool
    {
        $hazardOk = ! $this->isHwpCwp($permit) || $permit->tingkat_risiko !== null;
        $wahOk    = ! $this->isWah($permit)    || $permit->wah_persiapan_diisi_at !== null;
        $cseOk    = ! $this->isCse($permit)    || $permit->cse_persiapan_diisi_at !== null;

        return $hazardOk && $wahOk && $cseOk;
    }

    /**
     * WAH (Work at Height) punya alur Bagian 3/5/6/7 yang berbeda dari
     * HWP/CWP/CSE: Persiapan berupa JSA+Scaffolding file (bukan checklist
     * bahaya), Referensi Pendukung (Bagian 4) tidak wajib, dan Penerbitan/
     * Penerimaan diisi tanggal & jam manual oleh IA/PA.
     */
    public function isWah(Permit $permit): bool
    {
        return $this->jenisIzin($permit)->contains('WAH');
    }

    /** Izin mencakup HWP atau CWP — jenis yang memakai Bagian 3 checklist bahaya. */
    public function isHwpCwp(Permit $permit): bool
    {
        $jenis = $this->jenisIzin($permit);

        return $jenis->contains('HWP') || $jenis->contains('CWP');
    }

    /** Izin mencakup CSE (Confined Space Entry). */
    public function isCse(Permit $permit): bool
    {
        return $this->jenisIzin($permit)->contains('CSE');
    }

    /**
     * Apakah SELURUH "Bagian 3" dari SEMUA jenis izin yang melekat sudah lengkap?
     *
     * Satu izin dapat mencakup beberapa jenis sekaligus (mis. Pekerjaan Dingin di
     * ketinggian = CWP + WAH). Tiap jenis punya Bagian 3 sendiri yang berjalan
     * paralel, dan urutan pengisiannya bebas. IA baru boleh menerbitkan setelah
     * semuanya terisi — karena itu kelengkapan dilacak lewat penanda per bagian,
     * bukan lewat status tunggal.
     */
    public function bagian3Lengkap(Permit $permit): bool
    {
        // HWP/CWP: identifikasi bahaya (Bagian 3 checklist).
        if ($this->isHwpCwp($permit) && ! $permit->hazard_diisi_at) {
            return false;
        }

        // WAH: persiapan PA (JSA, perancah, daftar pekerja, peralatan).
        if ($this->isWah($permit) && ! $permit->wah_persiapan_diisi_at) {
            return false;
        }

        // CSE: persiapan PA (petugas jaga, peralatan khusus).
        if ($this->isCse($permit) && ! $permit->cse_persiapan_diisi_at) {
            return false;
        }

        return true;
    }

    public function recordTransition(
        Permit $permit,
        ?string $from,
        string $to,
        ?User $actor,
        string $aksi,
        array $extraBaru = []
    ): void {
        PermitStatusHistory::create([
            'permit_id'  => $permit->id,
            'status'     => $to,
            'changed_by' => $actor?->id,
            'changed_at' => now(),
        ]);

        AuditLog::create([
            'user_id'    => $actor?->id,
            'aksi'       => $aksi,
            'entitas'    => 'permits',
            'entitas_id' => $permit->id,
            'data_lama'  => $from ? ['status' => $from] : null,
            'data_baru'  => ['status' => $to] + $extraBaru,
            'logged_at'  => now(),
        ]);
    }
}