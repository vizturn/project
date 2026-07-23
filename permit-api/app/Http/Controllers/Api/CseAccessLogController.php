<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCseAccessLogRequest;
use App\Models\Permit;
use App\Services\PermitService;

/**
 * Bagian 7 — Log masuk/keluar ruang terbatas (khusus CSE).
 * Dicatat oleh Petugas Jaga yang ditetapkan PA (atau PA sendiri) saat izin
 * berstatus AKTIF. Sesuai flowchart Lampiran 10: IA diberi tahu sebelum dan
 * sesudah personel memasuki ruang terbatas.
 */
class CseAccessLogController extends Controller
{
    use HasPermitNotifications;

    public function __construct(private PermitService $service)
    {
    }

    public function index(Permit $permit)
    {
        return response()->json([
            'data' => $permit->cseAccessLogs()->with('dicatatOleh:id,name')->latest()->get(),
        ]);
    }

    public function store(StoreCseAccessLogRequest $request, Permit $permit)
    {
        $user = $request->user();

        if (! $this->service->isCse($permit)) {
            return response()->json(['message' => 'Endpoint ini khusus izin CSE (Confined Space Entry).'], 422);
        }

        // Yang boleh mencatat: Petugas Jaga yang ditetapkan, atau PA pemilik.
        $bolehCatat = (int) $permit->cse_petugas_jaga_id === (int) $user->id
            || (int) $permit->performing_authority_id === (int) $user->id;

        if (! $bolehCatat) {
            return response()->json(['message' => 'Hanya Petugas Jaga yang ditetapkan atau PA pemilik yang dapat mencatat keluar-masuk.'], 403);
        }

        if ($permit->status !== 'aktif') {
            return response()->json(['message' => 'Catatan keluar-masuk hanya dapat diisi saat izin berstatus AKTIF.'], 422);
        }

        $data = $request->validated();

        $log = $permit->cseAccessLogs()->create([
            'nama_pekerja' => $data['nama_pekerja'],
            'tanggal'      => $data['tanggal'],
            'jam_masuk'    => $data['jam_masuk'],
            'jam_keluar'   => $data['jam_keluar'] ?? null,
            'catatan'      => $data['catatan'] ?? null,
            'dicatat_oleh' => $user->id,
        ]);

        // Notifikasi ke IA — sebelum & sesudah masuk ruang terbatas.
        $tahap = empty($data['jam_keluar']) ? 'MASUK' : 'KELUAR';

        $this->notif(
            $permit->issuing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} (CSE): {$data['nama_pekerja']} {$tahap} ruang terbatas."
        );

        return response()->json([
            'message' => 'Catatan keluar-masuk ruang terbatas tersimpan.',
            'data'    => $log->load('dicatatOleh:id,name'),
        ], 201);
    }
}
