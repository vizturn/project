<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGasRequirementRequest;
use App\Http\Requests\StoreReferenceRequest;
use App\Models\AuditLog;
use App\Models\Permit;

/**
 * STEP 27 — Persiapan penerbitan oleh Issuing Authority (IA):
 *   Bagian 4 — Referensi Pendukung
 *   Bagian 5 — Penetapan Pengujian Kadar Gas
 */
class IssuancePrepController extends Controller
{
    /** Bagian 4 — Referensi Pendukung (wajib sebelum penerbitan). */
    public function storeReferences(StoreReferenceRequest $request, Permit $permit)
    {
        $user = $request->user();

        if ($salah = $this->tolakBilaBukanIaAtauStatusSalah($permit, $user)) {
            return $salah;
        }

        $data = $request->validated();
        $data['referensi_diisi_at'] = now();

        $permit->update($data);

        AuditLog::create([
            'user_id'    => $user->id,
            'aksi'       => 'store_references',
            'entitas'    => 'permits',
            'entitas_id' => $permit->id,
            'data_baru'  => $request->validated(),
            'logged_at'  => now(),
        ]);

        return response()->json([
            'message' => 'Referensi pendukung (Bagian 4) tersimpan.',
            'data'    => $permit->fresh(),
        ]);
    }

    /** Bagian 5 — IA menetapkan pengujian gas yang wajib dilakukan. */
    public function storeGasRequirement(StoreGasRequirementRequest $request, Permit $permit)
    {
        $user = $request->user();

        if ($salah = $this->tolakBilaBukanIaAtauStatusSalah($permit, $user)) {
            return $salah;
        }

        $data = $request->validated();
        $data['gas_ditetapkan_at'] = now();

        $permit->update($data);

        AuditLog::create([
            'user_id'    => $user->id,
            'aksi'       => 'set_gas_requirement',
            'entitas'    => 'permits',
            'entitas_id' => $permit->id,
            'data_baru'  => $request->validated(),
            'logged_at'  => now(),
        ]);

        return response()->json([
            'message' => 'Penetapan pengujian gas (Bagian 5) tersimpan.',
            'data'    => $permit->fresh(),
        ]);
    }

    /**
     * Guard bersama: harus IA yang ditugaskan, dan izin harus menunggu penerbitan.
     * Mengembalikan response error, atau null bila lolos.
     */
    private function tolakBilaBukanIaAtauStatusSalah(Permit $permit, $user)
    {
        if ($permit->issuing_authority_id !== null
            && (int) $permit->issuing_authority_id !== (int) $user->id) {
            return response()->json(['message' => 'Izin ini ditujukan kepada Issuing Authority lain.'], 403);
        }

        if ($permit->status !== 'menunggu_penerbitan') {
            return response()->json([
                'message' => 'Bagian ini hanya dapat diisi saat izin menunggu penerbitan.',
            ], 422);
        }

        return null;
    }
}
