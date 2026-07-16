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

    /**
     * Bagian 5 — Input hasil uji gas.
     * Sesuai formulir, pengujian "dilaksanakan oleh IA atau Authorized Gas Tester (AGT)",
     * sehingga KEDUA peran boleh mengisi hasilnya (kolom agt_id = pengisi).
     * Sistem hanya MENCATAT angka hasil pengukuran — tidak menilai aman/tidak
     * dan tidak memblokir penerbitan. Penilaian kondisi aman adalah wewenang IA
     * (lihat pernyataan Bagian 6 pada formulir PTW).
     */
    public function store(StoreGasTestRequest $request, Permit $permit)
    {
        $user = $request->user();

        $bolehStatus = ['disetujui', 'menunggu_penerbitan', 'menunggu_penerimaan', 'aktif', 'ditunda'];
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

        $gasTest = GasTest::create([
            'permit_id'      => $permit->id,
            'agt_id'         => $user->id,
            'tanggal'        => now()->toDateString(),
            'jam'            => now()->format('H:i:s'),
            'lel_persen'     => $lel,
            'oksigen_persen' => $o2,
            'co_ppm'         => $co,
            'h2s_ppm'        => $h2s,
        ]);

        AuditLog::create([
            'user_id'    => $user->id,
            'aksi'       => 'gas_test',
            'entitas'    => 'gas_tests',
            'entitas_id' => $gasTest->id,
            'data_baru'  => ['permit_id' => $permit->id],
            'logged_at'  => now(),
        ]);

        return response()->json([
            'message' => 'Hasil uji gas tercatat.',
            'data'    => $gasTest,
        ], 201);
    }
}
