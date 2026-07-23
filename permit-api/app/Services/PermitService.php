<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Permit;
use App\Models\PermitStatusHistory;
use App\Models\PermitType;
use App\Models\User;

/**
 * Pusat logika nomor izin & pencatatan transisi status
 * (agar konsisten: setiap transisi menulis permit_status_history + audit_logs).
 */
class PermitService
{
    /**
     * Nomor izin:
     *  - 1 jenis   -> {KODE}/{TAHUN}/{URUT}   mis. HWP/2026/0001  (format lama, deret per jenis)
     *  - >=2 jenis -> PTW/{TAHUN}/{URUT}      mis. PTW/2026/0001  (deret sendiri)
     *
     * @param  PermitType[]|\Illuminate\Support\Collection  $types
     */
    public function generateNomorIzin($types): string
    {
        $types  = collect($types);
        $prefix = $types->count() > 1
            ? 'PTW'
            : $types->first()->kode;

        return $this->nomorBerurutan($prefix);
    }

    private function nomorBerurutan(string $kode): string
    {
        $prefix = $kode . '/' . now()->year . '/';

        $last = Permit::where('nomor_izin', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->value('nomor_izin');

        $seq = $last
            ? ((int) substr($last, strlen($prefix))) + 1
            : 1;

        return $prefix . str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
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

        // CSE: aktifkan baris ini saat fitur Persiapan CSE dibuat.
        // if ($this->isCse($permit) && ! $permit->cse_persiapan_diisi_at) {
        //     return false;
        // }

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
