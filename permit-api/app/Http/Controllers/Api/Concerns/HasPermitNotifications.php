<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Notification;

/**
 * Dipakai bersama oleh PermitController dan controller-controller WAH
 * (WahPreparationController, WahAccessLogController) agar tidak duplikasi.
 */
trait HasPermitNotifications
{
    /**
     * Izin boleh dikerjakan siapa saja pemegang role terkait bila belum
     * ditugaskan ke orang tertentu (backward-compat izin lama).
     */
    private function ditugaskan(?int $ditugaskanKe, int $userId): bool
    {
        if ($ditugaskanKe === null) {
            return true;
        }

        return (int) $ditugaskanKe === (int) $userId;
    }

    /** Kirim notifikasi ke satu pengguna (diabaikan bila target kosong). */
    private function notif(?int $userId, int $permitId, string $pesan): void
    {
        if (! $userId) {
            return;
        }

        Notification::create([
            'user_id'   => $userId,
            'permit_id' => $permitId,
            'pesan'     => $pesan,
            'dibaca'    => false,
        ]);
    }
}
