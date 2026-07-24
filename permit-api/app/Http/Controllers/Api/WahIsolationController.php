<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWahIsolationRequest;
use App\Models\Permit;
use App\Services\PermitService;

/**
 * Bagian 3 — Persiapan (bagian IA, khusus WAH).
 * IA menentukan apakah Isolasi Energi diperlukan, dan jika ya melampirkan
 * Sertifikat Isolasi. Dilakukan SETELAH PA melengkapi Persiapan WAH
 * (WahPreparationController) — sejajar dengan Bagian 4 (Referensi Pendukung)
 * & Bagian 5 (Penetapan Uji Gas) yang juga diisi IA pada tahap yang sama,
 * sebelum menerbitkan izin. Tidak mengubah status keseluruhan izin — izin
 * tetap MENUNGGU_PENERBITAN sampai IA menekan tombol Terbitkan.
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
        if ($permit->status !== 'menunggu_penerbitan') {
            return response()->json(['message' => 'Evaluasi Isolasi Energi hanya dapat diisi setelah PA melengkapi Bagian 3 (Persiapan WAH).'], 422);
        }

        $data = $request->validated();
        $diperlukan = $request->boolean('wah_isolasi_diperlukan');

        $certPath = $diperlukan && $request->hasFile('wah_isolasi_cert_file')
            ? $request->file('wah_isolasi_cert_file')->store('wah/isolasi/' . $permit->id, 'public')
            : ($permit->wah_isolasi_cert_file_path ?: null);

        $permit->update([
            'wah_isolasi_diperlukan'     => $diperlukan,
            'wah_isolasi_cert_nomor'     => $diperlukan ? ($data['wah_isolasi_cert_nomor'] ?? null) : null,
            'wah_isolasi_cert_file_path' => $diperlukan ? $certPath : null,
            'wah_isolasi_diisi_at'       => now(),
        ]);

        // Status TIDAK berubah — masih di tahap Penerbitan (sama seperti Bagian 4/5).
        $this->service->recordTransition(
            $permit, 'menunggu_penerbitan', 'menunggu_penerbitan', $user, 'store_wah_isolation',
            ['wah_isolasi_diperlukan' => $diperlukan]
        );

        return response()->json(['message' => 'Evaluasi Isolasi Energi tersimpan.', 'data' => $permit]);
    }
}
