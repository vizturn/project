<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Requests\StoreGasTestRequest;
use App\Models\AuditLog;
use App\Models\GasTest;
use App\Models\Permit;
use Illuminate\Http\Request;

class GasTestController extends Controller
{
    use HasPermitNotifications;

    public function index(Permit $permit)
    {
        return response()->json([
            'data' => $permit->gasTests()->with('agt:id,name')->latest('id')->get(),
        ]);
    }

    /**
     * Bagian 5 — Input hasil uji gas.
     * Sesuai formulir, pengujian "dilaksanakan oleh IA atau Authorized Gas Tester (AGT)",
     * sehingga KEDUA peran boleh mengisi hasilnya (kolom agt_id = akun yang login/menginput).
     * Nama petugas yang SECARA FISIK melaksanakan pengetesan ditulis manual
     * (petugas_nama) karena bisa berbeda dari akun yang menginput, dan boleh
     * dilampiri foto dokumentasi pengetesan (opsional).
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

        // Foto dokumentasi pengetesan (opsional). Disimpan per izin di disk
        // "public", sama seperti pola file lain (PSB, JSA, dst) agar bisa
        // diakses langsung lewat /storage/... tanpa token.
        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('gas-tests/' . $permit->id, 'public');
        }

        $gasTest = GasTest::create([
            'permit_id'      => $permit->id,
            'agt_id'         => $user->id,
            'petugas_nama'   => $data['petugas_nama'],
            'fase'           => $data['fase'] ?? null,
            'tanggal'        => now()->toDateString(),
            'jam'            => now()->format('H:i:s'),
            'lel_persen'     => $lel,
            'oksigen_persen' => $o2,
            'co_ppm'         => $co,
            'h2s_ppm'        => $h2s,
            'foto_path'      => $fotoPath,
        ]);

        AuditLog::create([
            'user_id'    => $user->id,
            'aksi'       => 'gas_test',
            'entitas'    => 'gas_tests',
            'entitas_id' => $gasTest->id,
            'data_baru'  => ['permit_id' => $permit->id, 'petugas_nama' => $gasTest->petugas_nama],
            'logged_at'  => now(),
        ]);

        // PA mendapat notifikasi setiap kali IA/AGT menambah hasil uji gas baru
        // SETELAH izin sudah diterbitkan ke PA — baik saat masih menunggu
        // penerimaan PA, sudah aktif, maupun sedang ditunda. Berlaku untuk
        // SEMUA jenis izin (HWP/CWP/WAH/CSE) dan izin gabungan (mis. HWP+CSE),
        // karena tidak ada pengecekan jenis izin di sini — tiap kali baris
        // gas_tests baru dibuat pada status-status ini, PA diberi tahu.
        // Sebelum diterbitkan (disetujui/menunggu_penerbitan), PA belum
        // memegang izinnya sehingga cukup terlihat di Riwayat Uji Gas saat
        // IA/PA membuka detail izin, tanpa perlu notifikasi.
        $statusSudahDiterbitkanKePA = ['menunggu_penerimaan', 'aktif', 'ditunda'];
        if (in_array($permit->status, $statusSudahDiterbitkanKePA, true)) {
            $labelFase = $gasTest->fase ? ' fase ' . $gasTest->fase : '';
            $this->notif(
                $permit->performing_authority_id,
                $permit->id,
                "Hasil uji gas baru{$labelFase} dicatat oleh {$gasTest->petugas_nama} untuk izin {$permit->nomor_izin}."
            );
        }

        return response()->json([
            'message' => 'Hasil uji gas tercatat.',
            'data'    => $gasTest,
        ], 201);
    }
}
