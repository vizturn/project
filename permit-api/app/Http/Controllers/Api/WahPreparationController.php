<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWahPreparationRequest;
use App\Models\Permit;
use App\Services\PermitService;

/**
 * Bagian 3 — Persiapan (bagian PA, khusus WAH).
 * Langkah KEDUA dari Bagian 3 WAH (setelah IA menentukan kebutuhan
 * Isolasi Energi): PA mengisi JSA (opsional) dan, jika menggunakan
 * perancah, Scaffolding Certificate (wajib). Transisi:
 * menunggu_persiapan_pa -> menunggu_penerbitan.
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
        if ($permit->status !== 'menunggu_persiapan_pa') {
            return response()->json(['message' => 'Persiapan PA hanya dapat diisi setelah IA menentukan kebutuhan Isolasi Energi.'], 422);
        }

        $data = $request->validated();

        $jsaPath = $request->hasFile('jsa_file')
            ? $request->file('jsa_file')->store('wah/jsa/' . $permit->id, 'public')
            : null;

        $scaffoldingPath = $request->hasFile('wah_scaffolding_cert_file')
            ? $request->file('wah_scaffolding_cert_file')->store('wah/scaffolding/' . $permit->id, 'public')
            : null;

        $permit->update([
            'nomor_jsa'                      => $data['nomor_jsa'] ?? null,
            'jsa_file_path'                   => $jsaPath,
            'wah_menggunakan_perancah'        => $request->boolean('wah_menggunakan_perancah'),
            'wah_scaffolding_cert_nomor'      => $data['wah_scaffolding_cert_nomor'] ?? null,
            'wah_scaffolding_cert_file_path'  => $scaffoldingPath,
            'wah_persiapan_diisi_at'          => now(),
            'status'                          => 'menunggu_penerbitan',
        ]);

        $this->service->recordTransition(
            $permit, 'menunggu_persiapan_pa', 'menunggu_penerbitan', $user, 'store_wah_preparation',
            ['nomor_jsa' => $data['nomor_jsa'] ?? null, 'wah_menggunakan_perancah' => $request->boolean('wah_menggunakan_perancah')]
        );

        $this->notif(
            $permit->issuing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} (WAH): Persiapan telah diisi PA. Menunggu Penerbitan."
        );

        return response()->json(['message' => 'Persiapan WAH tersimpan. Menunggu Penerbitan.', 'data' => $permit]);
    }
}
