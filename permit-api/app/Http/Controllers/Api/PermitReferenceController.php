<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePermitReferenceRequest;
use App\Models\Permit;
use App\Models\PermitReference;
use App\Services\PermitService;

class PermitReferenceController extends Controller
{
    public function __construct(private PermitService $service)
    {
    }

    /**
     * Bagian 4 — IA melengkapi Referensi Pendukung.
     * Hanya berlaku untuk PTW Panas (HWP) & PTW Dingin (CWP), saat izin
     * berstatus menunggu_penerbitan (setelah PA melengkapi Bagian 3).
     * Dipakai berulang (updateOrCreate) agar IA bisa mengoreksi sebelum menerbitkan.
     */
    public function store(StorePermitReferenceRequest $request, Permit $permit)
    {
        $user = $request->user();

        if (! $this->service->butuhReferensiPendukung($permit)) {
            return response()->json([
                'message' => 'Referensi Pendukung (Bagian 4) hanya berlaku untuk PTW Panas / PTW Dingin.',
            ], 422);
        }

        if ($permit->status !== 'menunggu_penerbitan') {
            return response()->json([
                'message' => 'Referensi Pendukung hanya dapat diisi saat izin menunggu penerbitan.',
            ], 422);
        }

        if ($permit->issuing_authority_id !== null
            && (int) $permit->issuing_authority_id !== (int) $user->id) {
            return response()->json(['message' => 'Izin ini ditujukan kepada Issuing Authority lain.'], 403);
        }

        $reference = PermitReference::updateOrCreate(
            ['permit_id' => $permit->id],
            $request->validated() + ['filled_by' => $user->id, 'filled_at' => now()]
        );

        $this->service->recordTransition(
            $permit, 'menunggu_penerbitan', 'menunggu_penerbitan', $user, 'submit_permit_reference'
        );

        return response()->json([
            'message' => 'Referensi Pendukung (Bagian 4) tersimpan.',
            'data'    => $reference,
        ]);
    }
}
