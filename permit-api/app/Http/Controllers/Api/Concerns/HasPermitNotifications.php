<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\Notification;
use App\Models\User;
use App\Mail\PermitActionMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

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

    /**
     * Kirim notifikasi ke satu pengguna (diabaikan bila target kosong).
     *
     * @param  bool  $kirimEmail  Bila true, notifikasi ini JUGA dikirim sebagai
     *   email (dipakai untuk event "butuh aksi"/milestone penting saja — lihat
     *   daftar di dokumentasi fitur). Default false: cukup notifikasi in-app.
     */
    private function notif(?int $userId, int $permitId, string $pesan, bool $kirimEmail = false): void
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

        if ($kirimEmail) {
            $this->kirimEmailNotif($userId, $permitId, $pesan);
        }
    }

    /**
     * Kirim email notifikasi. Sengaja dibungkus try/catch: kegagalan pengiriman
     * email (SMTP down, alamat tidak valid, dll) TIDAK boleh menggagalkan aksi
     * utama (mis. penerbitan izin sudah tersimpan di DB). Error dicatat ke log
     * agar bisa ditelusuri, tapi alur tetap lanjut.
     */
    private function kirimEmailNotif(int $userId, int $permitId, string $pesan): void
    {
        try {
            $user = User::find($userId);
            if (! $user || ! $user->email) {
                return;
            }

            $permit = \App\Models\Permit::find($permitId);
            if (! $permit) {
                return;
            }

            Mail::to($user->email)->send(new PermitActionMail($user, $permit, $pesan));
        } catch (\Throwable $e) {
            Log::warning('Gagal mengirim email notifikasi permit', [
                'user_id'   => $userId,
                'permit_id' => $permitId,
                'error'     => $e->getMessage(),
            ]);
        }
    }
}
