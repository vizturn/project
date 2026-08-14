<?php

namespace App\Console\Commands;

use App\Mail\WeeklyRecapMail;
use App\Models\Permit;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

/**
 * Kirim rekap mingguan permit ke seluruh user ber-role SHE.
 *
 * Rekap = semua permit yang DIAJUKAN (created_at) dalam 7 hari terakhir dengan
 * status: aktif, ditunda (pending), selesai, closed. Berisi nomor izin, jenis,
 * nama pengaju (PA), status, dan tanggal diajukan.
 *
 * Dijadwalkan Senin pagi (lihat routes/console.php). Bisa juga dipanggil manual:
 *   php artisan permits:weekly-recap
 */
class SendWeeklyRecap extends Command
{
    protected $signature = 'permits:weekly-recap';
    protected $description = 'Kirim rekap mingguan permit (7 hari terakhir) ke tim SHE via email';

    /** Status yang masuk rekap (sesuai kesepakatan: aktif/pending/selesai/closed). */
    private const STATUS_REKAP = ['aktif', 'ditunda', 'selesai', 'closed'];

    public function handle(): int
    {
        $mulai   = now()->subDays(7)->startOfDay();
        $selesai = now()->endOfDay();

        // Ambil permit yang diajukan dalam 7 hari terakhir dengan status terkait.
        $permits = Permit::with(['performingAuthority:id,name', 'permitTypes:id,kode,nama'])
            ->whereBetween('created_at', [$mulai, $selesai])
            ->whereIn('status', self::STATUS_REKAP)
            ->orderBy('created_at')
            ->get();

        // Ambil semua user ber-role SHE (penerima rekap).
        $penerima = User::whereHas('roles', fn ($q) => $q->where('kode_role', 'SHE'))
            ->whereNotNull('email')
            ->get();

        if ($penerima->isEmpty()) {
            $this->warn('Tidak ada user ber-role SHE dengan email. Rekap tidak dikirim.');
            return self::SUCCESS;
        }

        $periodeMulai   = $mulai->format('d/m/Y');
        $periodeSelesai = $selesai->format('d/m/Y');

        foreach ($penerima as $user) {
            Mail::to($user->email)->send(
                new WeeklyRecapMail($permits, $periodeMulai, $periodeSelesai)
            );
            $this->info("Rekap terkirim ke {$user->email} ({$permits->count()} permit).");
        }

        $this->info("Selesai. Rekap dikirim ke {$penerima->count()} penerima SHE.");
        return self::SUCCESS;
    }
}
