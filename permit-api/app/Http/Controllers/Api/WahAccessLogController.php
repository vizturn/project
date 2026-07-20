<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWahAccessLogRequest;
use App\Models\Permit;
use App\Services\PermitService;
use Illuminate\Http\Request;

/**
 * Bagian 7 — Notifikasi Saat Memulai Bekerja di Ketinggian (khusus WAH).
 * PA mencatat jam naik dan/atau jam turun; boleh berkali-kali selama izin
 * berstatus AKTIF (riwayat tersimpan di wah_access_logs).
 */
class WahAccessLogController extends Controller
{
    use HasPermitNotifications;

    public function __construct(private PermitService $service)
    {
    }

    public function index(Request $request, Permit $permit)
    {
        return response()->json([
            'data' => $permit->wahAccessLogs()->with('dicatatOleh:id,name')->latest('id')->get(),
        ]);
    }

    public function store(StoreWahAccessLogRequest $request, Permit $permit)
    {
        $user = $request->user();

        if (! $this->service->isWah($permit)) {
            return response()->json(['message' => 'Endpoint ini khusus izin WAH (Work at Height).'], 422);
        }
        if ((int) $permit->performing_authority_id !== (int) $user->id) {
            return response()->json(['message' => 'Hanya PA pemilik yang dapat mencatat naik/turun.'], 403);
        }
        if ($permit->status !== 'aktif') {
            return response()->json(['message' => 'Naik/turun hanya dapat dicatat saat izin AKTIF.'], 422);
        }

        $data = $request->validated();

        $log = $permit->wahAccessLogs()->create([
            'tanggal'      => now()->toDateString(),
            'jam_naik'     => $data['jam_naik'] ?? null,
            'jam_turun'    => $data['jam_turun'] ?? null,
            'catatan'      => $data['catatan'] ?? null,
            'dicatat_oleh' => $user->id,
        ]);

        $ket = collect([
            $data['jam_naik'] ?? null ? "naik {$data['jam_naik']}" : null,
            $data['jam_turun'] ?? null ? "turun {$data['jam_turun']}" : null,
        ])->filter()->implode(' & ');

        $this->notif(
            $permit->issuing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} (WAH): PA mencatat {$ket}."
        );

        return response()->json(['message' => 'Catatan naik/turun tersimpan.', 'data' => $log], 201);
    }
}
