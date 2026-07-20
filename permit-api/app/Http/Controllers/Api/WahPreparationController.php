<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWahPreparationRequest;
use App\Models\Permit;
use App\Services\PermitService;

/**
 * Bagian 3 — Persiapan (khusus izin WAH).
 * Berbeda dari HWP/CWP/CSE (checklist Identifikasi Bahaya via HazardController):
 * PA hanya mengisi JSA (nomor + file) dan, jika menggunakan perancah,
 * Scaffolding Certificate (nomor + file). Transisi status sama seperti
 * Bagian 3 lain: disetujui -> menunggu_penerbitan.
 */
class WahPreparationController extends Controller
{
    use HasPermitNotifications;

    public function __construct(private PermitService $service)
    {
    }

    public function store(StoreWahPreparationRequest $request, Permit $permit)
    {
        $user = $request->user();

        if (! $this->service->isWah($permit)) {
            return response()->json(['message' => 'Endpoint ini khusus izin WAH (Work at Height).'], 422);
        }
        if ((int) $permit->performing_authority_id !== (int) $user->id) {
            return response()->json(['message' => 'Hanya PA pemilik yang dapat mengisi Persiapan.'], 403);
        }
        if ($permit->status !== 'disetujui') {
            return response()->json(['message' => 'Persiapan hanya dapat diisi saat izin berstatus DISETUJUI.'], 422);
        }

        $data = $request->validated();

        $jsaPath = $request->file('jsa_file')->store('wah/jsa/' . $permit->id, 'public');

        $scaffoldingPath = null;
        if ($request->boolean('wah_menggunakan_perancah') && $request->hasFile('wah_scaffolding_cert_file')) {
            $scaffoldingPath = $request->file('wah_scaffolding_cert_file')->store('wah/scaffolding/' . $permit->id, 'public');
        }

        $permit->update([
            'nomor_jsa'                      => $data['nomor_jsa'],
            'jsa_file_path'                   => $jsaPath,
            'wah_menggunakan_perancah'        => $request->boolean('wah_menggunakan_perancah'),
            'wah_scaffolding_cert_nomor'      => $request->boolean('wah_menggunakan_perancah') ? $data['wah_scaffolding_cert_nomor'] : null,
            'wah_scaffolding_cert_file_path'  => $scaffoldingPath,
            'wah_persiapan_diisi_at'          => now(),
            'status'                          => 'menunggu_penerbitan',
        ]);

        $this->service->recordTransition(
            $permit, 'disetujui', 'menunggu_penerbitan', $user, 'store_wah_preparation',
            ['nomor_jsa' => $data['nomor_jsa'], 'wah_menggunakan_perancah' => $request->boolean('wah_menggunakan_perancah')]
        );

        $this->notif(
            $permit->issuing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} (WAH): Persiapan (JSA".($scaffoldingPath ? ' & Scaffolding Certificate' : '')." ) telah diisi PA. Menunggu Penerbitan."
        );

        return response()->json(['message' => 'Persiapan WAH tersimpan. Menunggu Penerbitan.', 'data' => $permit]);
    }
}
