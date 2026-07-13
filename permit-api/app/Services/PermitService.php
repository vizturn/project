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
