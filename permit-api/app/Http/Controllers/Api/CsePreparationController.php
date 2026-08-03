<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCsePreparationRequest;
use App\Models\Permit;
use App\Services\PermitService;

/**
 * Bagian 3 — Persiapan (bagian PA, khusus CSE).
 * PA mencatat nama Petugas Jaga (teks bebas), peralatan komunikasi, peralatan
 * khusus ruang terbatas, nomor & file JSA.
 *
 * Alur: PA mengisi persiapan langsung setelah izin DISETUJUI (bersamaan dengan
 * identifikasi bahaya bila izin gabungan). Isolasi Energi CSE ditentukan IA
 * kemudian pada tahap menunggu_penerbitan (opsional), bukan prasyarat.
 *
 * Izin GABUNGAN: status maju ke menunggu_penerbitan hanya setelah SELURUH
 * Bagian 3 dari semua jenis izin lengkap.
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
        // PA mengisi persiapan pada tahap disetujui (atau saat masih melengkapi
        // bagian lain pada izin gabungan).
        if (! in_array($permit->status, ['disetujui', 'menunggu_persiapan_pa'], true)) {
            return response()->json(['message' => 'Persiapan hanya dapat diisi setelah izin disetujui.'], 422);
        }

        $data = $request->validated();
        $statusLama = $permit->status;

        $jsaPath = $permit->jsa_file_path;
        if ($request->hasFile('jsa_file')) {
            $jsaPath = $request->file('jsa_file')->store('jsa/' . $permit->id, 'public');
        }

        $permit->update([
            'cse_petugas_jaga_nama'  => $data['cse_petugas_jaga_nama'],
            'cse_alat_komunikasi'    => $data['cse_alat_komunikasi'] ?? null,
            'nomor_jsa'              => $data['nomor_jsa'] ?? null,
            'jsa_file_path'          => $jsaPath,
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
            $statusLama,
            $lanjut ? 'menunggu_penerbitan' : $statusLama,
            $user,
            'store_cse_preparation',
            ['cse_petugas_jaga_nama' => $data['cse_petugas_jaga_nama']]
        );

        if ($lanjut) {
            $this->notif(
                $permit->issuing_authority_id,
                $permit->id,
                "Izin {$permit->nomor_izin}: seluruh Bagian 3 lengkap. Menunggu Penerbitan.",
                kirimEmail: true
            );
        }

        return response()->json([
            'message' => $lanjut
                ? 'Persiapan CSE tersimpan. Menunggu Penerbitan.'
                : 'Persiapan CSE tersimpan. Lengkapi bagian jenis izin lainnya sebelum dapat diterbitkan.',
            'data'    => $permit->fresh(),
        ]);
    }
}
