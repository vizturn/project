<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWahPreparationRequest;
use App\Models\Permit;
use App\Models\PermitPersonnel;
use App\Services\PermitService;
use Illuminate\Support\Facades\DB;

/**
 * Bagian 3 — Persiapan (bagian PA, khusus WAH).
 * Langkah KEDUA dari Bagian 3 WAH (setelah IA menentukan kebutuhan
 * Isolasi Energi): PA mengisi JSA (opsional), Scaffolding Certificate
 * (wajib jika pakai perancah), daftar pekerja, dan peralatan khusus.
 * Transisi: menunggu_persiapan_pa -> menunggu_penerbitan.
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

<<<<<<< HEAD
        DB::transaction(function () use ($permit, $user, $data, $request, $jsaPath, $scaffoldingPath) {
            $permit->update([
                'nomor_jsa'                      => $data['nomor_jsa'] ?? null,
=======
        // Semua tulisan (permit + pekerja) dalam satu transaksi agar konsisten.
        DB::transaction(function () use ($permit, $request, $data, $jsaPath, $scaffoldingPath) {
            $permit->update([
                'nomor_jsa'                       => $data['nomor_jsa'] ?? null,
>>>>>>> afe347c16aa540695405a53153114a00066b203f
                'jsa_file_path'                   => $jsaPath,
                'wah_menggunakan_perancah'        => $request->boolean('wah_menggunakan_perancah'),
                'wah_scaffolding_cert_nomor'      => $data['wah_scaffolding_cert_nomor'] ?? null,
                'wah_scaffolding_cert_file_path'  => $scaffoldingPath,
<<<<<<< HEAD

                // Petugas pengawas keselamatan & peralatan komunikasi.
                'wah_nama_petugas_pengawas' => $data['wah_nama_petugas_pengawas'],
                'wah_peralatan_komunikasi'  => $data['wah_peralatan_komunikasi'] ?? null,

                // Checklist peralatan khusus (Bagian 3) — dicek kelayakan & ketersediaannya oleh IA saat Penerbitan.
                'wah_alat_full_body_harness' => $request->boolean('alat_full_body_harness'),
                'wah_alat_double_lanyard'    => $request->boolean('alat_double_lanyard'),
                'wah_alat_anchor_point'      => $request->boolean('alat_anchor_point'),
                'wah_alat_barrier'           => $request->boolean('alat_barrier'),
                'wah_alat_medic_kit'         => $request->boolean('alat_medic_kit'),
                'wah_alat_ambulance'         => $request->boolean('alat_ambulance'),
                'wah_alat_lainnya'           => $data['alat_lainnya'] ?? null,

                'wah_persiapan_diisi_at' => now(),
                'status'                 => 'menunggu_penerbitan',
            ]);

            // Daftar pekerja yang diizinkan bekerja di ketinggian + status pelatihan (Ya/Tidak).
            // Ganti seluruh daftar tiap kali form ini disimpan agar tetap sinkron dengan input terbaru PA.
            $permit->personnel()->where('peran_pekerjaan', 'Pekerja Ketinggian (WAH)')->delete();
            foreach ($data['pekerja'] as $pekerja) {
                PermitPersonnel::create([
                    'permit_id'                  => $permit->id,
                    'nama'                        => $pekerja['nama'],
                    'peran_pekerjaan'             => 'Pekerja Ketinggian (WAH)',
                    'telah_pelatihan_ketinggian'  => $pekerja['telah_pelatihan'],
                ]);
            }

            $this->service->recordTransition(
                $permit, 'menunggu_persiapan_pa', 'menunggu_penerbitan', $user, 'store_wah_preparation',
                [
                    'nomor_jsa'                => $data['nomor_jsa'] ?? null,
                    'wah_menggunakan_perancah' => $request->boolean('wah_menggunakan_perancah'),
                    'jumlah_pekerja'           => count($data['pekerja']),
                ]
            );
        });
=======
                'wah_peralatan'                   => $data['peralatan'] ?? [],
                'wah_peralatan_lainnya'           => $data['peralatan_lainnya'] ?? null,
                'wah_persiapan_diisi_at'          => now(),
                'status'                          => 'menunggu_penerbitan',
            ]);

            // Daftar pekerja: replace pattern — hapus lama, isi ulang dari input.
            $permit->wahWorkers()->delete();
            foreach ($data['workers'] as $w) {
                $permit->wahWorkers()->create([
                    'nama_pekerja'    => $w['nama_pekerja'],
                    'sudah_pelatihan' => (bool) $w['sudah_pelatihan'],
                ]);
            }
        });

        $this->service->recordTransition(
            $permit, 'menunggu_persiapan_pa', 'menunggu_penerbitan', $user, 'store_wah_preparation',
            [
                'nomor_jsa'                => $data['nomor_jsa'] ?? null,
                'wah_menggunakan_perancah' => $request->boolean('wah_menggunakan_perancah'),
                'jumlah_pekerja'           => count($data['workers']),
            ]
        );
>>>>>>> afe347c16aa540695405a53153114a00066b203f

        $this->notif(
            $permit->issuing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} (WAH): Persiapan telah diisi PA (petugas, daftar pekerja & peralatan). Menunggu Penerbitan."
        );

        return response()->json([
            'message' => 'Persiapan WAH tersimpan. Menunggu Penerbitan.',
<<<<<<< HEAD
            'data'    => $permit->fresh()->load('personnel'),
=======
            'data'    => $permit->load('wahWorkers'),
>>>>>>> afe347c16aa540695405a53153114a00066b203f
        ]);
    }
}
