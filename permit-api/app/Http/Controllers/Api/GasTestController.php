<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGasTestRequest;
use App\Models\AuditLog;
use App\Models\GasTest;
use App\Models\Permit;
use Illuminate\Http\Request;

class GasTestController extends Controller
{
    public function index(Permit $permit)
    {
        return response()->json([
            'data' => $permit->gasTests()->with('agt:id,name')->latest('id')->get(),
        ]);
    }

    /** S13 — AGT input uji gas; sistem menilai AMAN/TIDAK terhadap ambang SOP. */
    public function store(StoreGasTestRequest $request, Permit $permit)
    {
        $user = $request->user();

        $bolehStatus = ['disetujui', 'menunggu_penerbitan', 'aktif', 'ditunda'];
        if (! in_array($permit->status, $bolehStatus, true)) {
            return response()->json([
                'message' => 'Uji gas hanya dapat diinput setelah izin disetujui.',
            ], 422);
        }

        $data = $request->validated();
        $o2   = (float) $data['oksigen_persen'];
        $lel  = (float) $data['lel_persen'];
        $co   = isset($data['co_ppm'])  ? (float) $data['co_ppm']  : null;
        $h2s  = isset($data['h2s_ppm']) ? (float) $data['h2s_ppm'] : null;

        // Ambang aman (SOP §9.4 / Lampiran 9)
        $aman = ($o2 >= 19.5 && $o2 <= 23.5)
            && ($lel < 10)
            && ($co === null || $co < 35)
            && ($h2s === null || $h2s < 10);

        $gasTest = GasTest::create([
            'permit_id'      => $permit->id,
            'agt_id'         => $user->id,
            'tanggal'        => now()->toDateString(),
            'jam'            => now()->format('H:i:s'),
            'lel_persen'     => $lel,
            'oksigen_persen' => $o2,
            'co_ppm'         => $co,
            'h2s_ppm'        => $h2s,
            'hasil_aman'     => $aman,
        ]);

        AuditLog::create([
            'user_id'    => $user->id,
            'aksi'       => 'gas_test',
            'entitas'    => 'gas_tests',
            'entitas_id' => $gasTest->id,
            'data_baru'  => ['permit_id' => $permit->id, 'hasil_aman' => $aman],
            'logged_at'  => now(),
        ]);

        return response()->json([
            'message' => $aman
                ? 'Hasil uji gas AMAN.'
                : 'Hasil uji gas TIDAK AMAN — lakukan mitigasi sebelum penerbitan.',
            'data' => $gasTest,
        ], 201);
    }
}
