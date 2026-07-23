<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCsePreparationRequest;
use App\Models\Permit;
use App\Services\PermitService;

/**
 * Bagian 3 — Persiapan (bagian PA, khusus CSE).
 * PA menetapkan Petugas Jaga (user ber-role PJ) yang akan mencatat keluar-masuk
 * personel, peralatan komunikasi, serta peralatan khusus ruang terbatas.
 *
 * Izin GABUNGAN: status baru maju ke menunggu_penerbitan setelah SELURUH
 * Bagian 3 dari SEMUA jenis izin lengkap. Urutan bebas.
 */
class CsePreparationController extends Controller
{
    use HasPermitNotifications;

    public function __construct(private PermitService $service)
    {
    }

    public function store(StoreCsePreparationRequest $request, Permit $permit)
    {
        $user = $request->user();

        if (! $this->service->isCse($permit)) {
            return response()->json(['message' => 'Endpoint ini khusus izin CSE (Confined Space Entry).'], 422);
        }
        if ((int) $permit->performing_authority_id !== (int) $user->id) {
            return response()->json(['message' => 'Hanya PA pemilik yang dapat mengisi Persiapan.'], 403);
        }
        if ($permit->status !== 'menunggu_persiapan_pa') {
            return response()->json(['message' => 'Persiapan PA hanya dapat diisi setelah IA menentukan kebutuhan Isolasi Energi.'], 422);
        }

        $data = $request->validated();

        $permit->update([
            'cse_petugas_jaga_id'    => $data['cse_petugas_jaga_id'],
            'cse_alat_komunikasi'    => $data['cse_alat_komunikasi'] ?? null,
            'cse_peralatan'          => $data['peralatan'] ?? [],
            'cse_peralatan_lainnya'  => $data['peralatan_lainnya'] ?? null,
            'cse_persiapan_diisi_at' => now(),
        ]);

        // Maju ke penerbitan HANYA jika seluruh Bagian 3 dari semua jenis izin lengkap.
        $lanjut = $this->service->bagian3Lengkap($permit->fresh());

        if ($lanjut) {
            $permit->update(['status' => 'menunggu_penerbitan']);
        }

        $this->service->recordTransition(
            $permit,
            'menunggu_persiapan_pa',
            $lanjut ? 'menunggu_penerbitan' : 'menunggu_persiapan_pa',
            $user,
            'store_cse_preparation',
            ['cse_petugas_jaga_id' => $data['cse_petugas_jaga_id']]
        );

        if ($lanjut) {
            $this->notif(
                $permit->issuing_authority_id,
                $permit->id,
                "Izin {$permit->nomor_izin}: seluruh Bagian 3 lengkap. Menunggu Penerbitan."
            );
        }

        // Petugas Jaga diberi tahu bahwa ia ditugaskan pada izin ini.
        $this->notif(
            $data['cse_petugas_jaga_id'],
            $permit->id,
            "Anda ditetapkan sebagai Petugas Jaga pada izin {$permit->nomor_izin} (CSE)."
        );

        return response()->json([
            'message' => $lanjut
                ? 'Persiapan CSE tersimpan. Menunggu Penerbitan.'
                : 'Persiapan CSE tersimpan. Lengkapi bagian jenis izin lainnya sebelum dapat diterbitkan.',
            'data'    => $permit->load('csePetugasJaga:id,name,jabatan'),
        ]);
    }
}
