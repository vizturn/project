<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCseIsolationRequest;
use App\Models\Permit;
use App\Services\PermitService;

/**
 * Isolasi Energi CSE (bagian IA) — OPSIONAL.
 * Setelah PA melengkapi Persiapan (izin di menunggu_penerbitan), IA dapat
 * menentukan apakah Isolasi Energi diperlukan dan melampirkan sertifikatnya
 * sebelum menerbitkan izin. Tidak mengubah status (bukan gerbang alur).
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
        // IA mengisi isolasi pada tahap menunggu_penerbitan (setelah PA persiapan),
        // sebelum menerbitkan izin.
        if ($permit->status !== 'menunggu_penerbitan') {
            return response()->json(['message' => 'Isolasi Energi diisi pada tahap Menunggu Penerbitan.'], 422);
        }

        $data = $request->validated();
        $diperlukan = $request->boolean('cse_isolasi_diperlukan');

        $certPath = $permit->cse_isolasi_cert_file_path;
        if ($diperlukan && $request->hasFile('cse_isolasi_cert_file')) {
            $certPath = $request->file('cse_isolasi_cert_file')->store('cse/isolasi/' . $permit->id, 'public');
        }

        $permit->update([
            'cse_isolasi_diperlukan'     => $diperlukan,
            'cse_isolasi_cert_nomor'     => $diperlukan ? ($data['cse_isolasi_cert_nomor'] ?? null) : null,
            'cse_isolasi_cert_file_path' => $diperlukan ? $certPath : null,
            'cse_isolasi_diisi_at'       => now(),
            'issuing_authority_id'       => $user->id,
        ]);

        $this->service->recordTransition(
            $permit, $permit->status, $permit->status, $user, 'store_cse_isolation',
            ['cse_isolasi_diperlukan' => $diperlukan]
        );

        return response()->json(['message' => 'Evaluasi Isolasi Energi CSE tersimpan.', 'data' => $permit->fresh()]);
    }
}
