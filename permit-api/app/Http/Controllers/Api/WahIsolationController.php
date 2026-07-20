<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWahIsolationRequest;
use App\Models\Permit;
use App\Services\PermitService;

/**
 * Bagian 3 — Persiapan (bagian IA, khusus WAH).
 * Langkah PERTAMA dari Bagian 3 WAH (sebelum PA mengisi JSA/Scaffolding):
 * IA menentukan apakah Isolasi Energi diperlukan, dan jika ya melampirkan
 * Sertifikat Isolasi. Transisi: disetujui -> menunggu_persiapan_pa.
 */
class WahIsolationController extends Controller
{
    use HasPermitNotifications;

    public function __construct(private PermitService $service)
    {
    }

    public function store(StoreWahIsolationRequest $request, Permit $permit)
    {
        $user = $request->user();

        if (! $this->service->isWah($permit)) {
            return response()->json(['message' => 'Endpoint ini khusus izin WAH (Work at Height).'], 422);
        }
        if (! $this->ditugaskan($permit->issuing_authority_id, $user->id)) {
            return response()->json(['message' => 'Izin ini ditujukan kepada Issuing Authority lain.'], 403);
        }
        if ($permit->status !== 'disetujui') {
            return response()->json(['message' => 'Evaluasi Isolasi Energi hanya dapat diisi saat izin berstatus DISETUJUI.'], 422);
        }

        $data = $request->validated();
        $diperlukan = $request->boolean('wah_isolasi_diperlukan');

        $certPath = $diperlukan && $request->hasFile('wah_isolasi_cert_file')
            ? $request->file('wah_isolasi_cert_file')->store('wah/isolasi/' . $permit->id, 'public')
            : null;

        $permit->update([
            'wah_isolasi_diperlukan'     => $diperlukan,
            'wah_isolasi_cert_nomor'     => $diperlukan ? ($data['wah_isolasi_cert_nomor'] ?? null) : null,
            'wah_isolasi_cert_file_path' => $certPath,
            'wah_isolasi_diisi_at'       => now(),
            'issuing_authority_id'       => $user->id,
            'status'                     => 'menunggu_persiapan_pa',
        ]);

        $this->service->recordTransition(
            $permit, 'disetujui', 'menunggu_persiapan_pa', $user, 'store_wah_isolation',
            ['wah_isolasi_diperlukan' => $diperlukan]
        );

        $this->notif(
            $permit->performing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} (WAH): IA telah menentukan kebutuhan Isolasi Energi. Silakan lengkapi Persiapan (JSA & Scaffolding)."
        );

        return response()->json(['message' => 'Evaluasi Isolasi Energi tersimpan. Menunggu Persiapan PA.', 'data' => $permit]);
    }
}
