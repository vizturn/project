<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCseIsolationRequest;
use App\Models\Permit;
use App\Services\PermitService;

/**
 * Bagian 3 — Persiapan (bagian IA, khusus CSE).
 * IA menentukan apakah Isolasi Energi diperlukan untuk masuk ruang terbatas,
 * dan jika ya melampirkan Sertifikat Isolasi.
 * Transisi: disetujui -> menunggu_persiapan_pa.
 */
class CseIsolationController extends Controller
{
    use HasPermitNotifications;

    public function __construct(private PermitService $service)
    {
    }

    public function store(StoreCseIsolationRequest $request, Permit $permit)
    {
        $user = $request->user();

        if (! $this->service->isCse($permit)) {
            return response()->json(['message' => 'Endpoint ini khusus izin CSE (Confined Space Entry).'], 422);
        }
        if (! $this->ditugaskan($permit->issuing_authority_id, $user->id)) {
            return response()->json(['message' => 'Izin ini ditujukan kepada Issuing Authority lain.'], 403);
        }
        // Izin gabungan (mis. CSE + WAH) bisa sudah bergeser ke menunggu_persiapan_pa
        // karena isolasi jenis lain sudah diisi. Urutan bebas.
        if (! in_array($permit->status, ['disetujui', 'menunggu_persiapan_pa'], true)) {
            return response()->json(['message' => 'Evaluasi Isolasi Energi hanya dapat diisi setelah izin disetujui AA.'], 422);
        }

        $data = $request->validated();
        $diperlukan = $request->boolean('cse_isolasi_diperlukan');

        $certPath = $diperlukan && $request->hasFile('cse_isolasi_cert_file')
            ? $request->file('cse_isolasi_cert_file')->store('cse/isolasi/' . $permit->id, 'public')
            : null;

        $statusLama = $permit->status;

        $permit->update([
            'cse_isolasi_diperlukan'     => $diperlukan,
            'cse_isolasi_cert_nomor'     => $diperlukan ? ($data['cse_isolasi_cert_nomor'] ?? null) : null,
            'cse_isolasi_cert_file_path' => $certPath,
            'cse_isolasi_diisi_at'       => now(),
            'issuing_authority_id'       => $user->id,
            'status'                     => 'menunggu_persiapan_pa',
        ]);

        $this->service->recordTransition(
            $permit, $statusLama, 'menunggu_persiapan_pa', $user, 'store_cse_isolation',
            ['cse_isolasi_diperlukan' => $diperlukan]
        );

        $this->notif(
            $permit->performing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} (CSE): IA telah menentukan kebutuhan Isolasi Energi. Silakan lengkapi Persiapan (petugas jaga & peralatan)."
        );

        return response()->json(['message' => 'Evaluasi Isolasi Energi CSE tersimpan. Menunggu Persiapan PA.', 'data' => $permit]);
    }
}
