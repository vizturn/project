<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLiveAuditRequest;
use App\Models\AuditLog;
use App\Models\LiveAudit;
use App\Models\Permit;

class LiveAuditController extends Controller
{
    public function index(Permit $permit)
    {
        return response()->json([
            'data' => $permit->liveAudits()->with('auditor:id,name')->latest('id')->get(),
        ]);
    }

    /** S18 — SPV mencatat live audit (hanya saat izin AKTIF). */
    public function store(StoreLiveAuditRequest $request, Permit $permit)
    {
        $user = $request->user();

        if ($permit->status !== 'aktif') {
            return response()->json(['message' => 'Live audit hanya dapat dilakukan pada izin AKTIF.'], 422);
        }

        $audit = LiveAudit::create([
            'permit_id'  => $permit->id,
            'auditor_id' => $user->id,
            'tanggal'    => now()->toDateString(),
            'jam'        => now()->format('H:i:s'),
            'catatan'    => $request->validated()['catatan'] ?? null,
        ]);

        AuditLog::create([
            'user_id'    => $user->id,
            'aksi'       => 'live_audit',
            'entitas'    => 'live_audits',
            'entitas_id' => $audit->id,
            'data_baru'  => ['permit_id' => $permit->id],
            'logged_at'  => now(),
        ]);

        return response()->json(['message' => 'Live audit tercatat.', 'data' => $audit], 201);
    }
}
