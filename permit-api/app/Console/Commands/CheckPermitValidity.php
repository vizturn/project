<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Permit;
use App\Models\PermitStatusHistory;
use App\Services\PermitService;
use Illuminate\Console\Command;

class CheckPermitValidity extends Command
{
    protected $signature = 'permits:check-validity';
    protected $description = 'Auto-suspend izin melewati validitas 12 jam & auto-kadaluarsa 72 jam';

    public function handle(PermitService $service): int
    {
        $now       = now();
        $suspended = 0;
        $expired   = 0;

        // 1) KADALUARSA — izin aktif/ditunda yang melewati tgl_kadaluarsa (72 jam)
        $lewatMasa = Permit::whereIn('status', ['aktif', 'ditunda'])
            ->whereNotNull('tgl_kadaluarsa')
            ->where('tgl_kadaluarsa', '<', $now)
            ->get();

        foreach ($lewatMasa as $permit) {
            $from = $permit->status;
            $permit->update(['status' => 'kadaluarsa']);
            $service->recordTransition($permit, $from, 'kadaluarsa', null, 'auto_expire');
            $this->notifPA($permit, "Izin {$permit->nomor_izin} KADALUARSA (masa berlaku 72 jam terlewati).");
            $expired++;
        }

        // 2) DITUNDA — izin aktif yang periode aktifnya sudah >= 12 jam
        $aktif = Permit::where('status', 'aktif')
            ->where(function ($q) use ($now) {
                $q->whereNull('tgl_kadaluarsa')->orWhere('tgl_kadaluarsa', '>=', $now);
            })
            ->get();

        foreach ($aktif as $permit) {
            $mulaiRow = PermitStatusHistory::where('permit_id', $permit->id)
                ->where('status', 'aktif')
                ->latest('changed_at')
                ->first();

            $mulai = $mulaiRow?->changed_at; // sudah Carbon (cast di model)

            if ($mulai && $mulai->diffInHours($now) >= 12) {
                $permit->update(['status' => 'ditunda']);
                $service->recordTransition($permit, 'aktif', 'ditunda', null, 'auto_suspend');
                $this->notifPA($permit, "Izin {$permit->nomor_izin} DITUNDA otomatis (validitas 12 jam). Perlu revalidasi.");
                $suspended++;
            }
        }

        $this->info("Selesai. Ditunda: {$suspended}, Kadaluarsa: {$expired}.");

        return self::SUCCESS;
    }

    private function notifPA(Permit $permit, string $pesan): void
    {
        if (! $permit->performing_authority_id) {
            return;
        }

        Notification::create([
            'user_id'   => $permit->performing_authority_id,
            'permit_id' => $permit->id,
            'pesan'     => $pesan,
            'dibaca'    => false,
        ]);
    }
}
