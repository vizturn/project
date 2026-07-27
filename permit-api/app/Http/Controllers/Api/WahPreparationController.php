<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\HasPermitNotifications;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWahPreparationRequest;
use App\Models\Permit;
use App\Services\PermitService;
use Illuminate\Support\Facades\DB;

/**
 * Bagian 3 — Persiapan (bagian PA, khusus WAH).
 * PA mengisi langsung setelah izin DISETUJUI AA (sejajar dengan Identifikasi
 * Bahaya PTW Panas/Dingin bila izin ini gabungan — lihat HazardController):
 * JSA (opsional), Scaffolding Certificate (jika pakai perancah), daftar
 * pekerja di ketinggian, dan checklist peralatan khusus.
 *
 * Evaluasi Isolasi Energi TIDAK lagi mendahului langkah ini — itu sekarang
 * dilakukan IA belakangan, bersamaan dengan Bagian 4/5, lihat WahIsolationController.
 *
 * Transisi: disetujui -> menunggu_penerbitan, TAPI hanya jika seluruh bagian
 * Bagian 3 yang relevan sudah lengkap (PermitService::bagian3Selesai) — pada
 * izin gabungan (mis. HWP + WAH), status tetap DISETUJUI sampai PA juga
 * melengkapi Identifikasi Bahaya PTW.
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
            return response()->json(['message' => 'Persiapan WAH hanya dapat diisi setelah izin disetujui AA.'], 422);
        }

        $data = $request->validated();

        $jsaPath = $request->hasFile('jsa_file')
            ? $request->file('jsa_file')->store('wah/jsa/' . $permit->id, 'public')
            : null;

        $scaffoldingPath = $request->hasFile('wah_scaffolding_cert_file')
            ? $request->file('wah_scaffolding_cert_file')->store('wah/scaffolding/' . $permit->id, 'public')
            : null;

        // Permit + daftar pekerja ditulis dalam satu transaksi agar konsisten.
        DB::transaction(function () use ($permit, $request, $data, $jsaPath, $scaffoldingPath) {
            $permit->update([
                'nomor_jsa'                      => $data['nomor_jsa'] ?? null,
                'jsa_file_path'                  => $jsaPath,
                'wah_menggunakan_perancah'       => $request->boolean('wah_menggunakan_perancah'),
                'wah_scaffolding_cert_nomor'     => $data['wah_scaffolding_cert_nomor'] ?? null,
                'wah_scaffolding_cert_file_path' => $scaffoldingPath,
                'wah_peralatan'                  => $data['peralatan'] ?? [],
                'wah_peralatan_lainnya'          => $data['peralatan_lainnya'] ?? null,
                'wah_persiapan_diisi_at'         => now(),
            ]);

            // Daftar pekerja: replace-pattern (hapus lama, isi ulang) agar aman bila PA submit ulang.
            $permit->wahWorkers()->delete();
            foreach ($data['workers'] as $w) {
                $permit->wahWorkers()->create([
                    'nama_pekerja'    => $w['nama_pekerja'],
                    'sudah_pelatihan' => (bool) $w['sudah_pelatihan'],
                ]);
            }
        });

        $permit->refresh();

        // Izin gabungan (mis. HWP + WAH) baru lanjut ke IA setelah Identifikasi
        // Bahaya PTW-nya juga terisi — kalau belum, tetap DISETUJUI dulu.
        if (! $this->service->bagian3Selesai($permit)) {
            $this->service->recordTransition(
                $permit, 'disetujui', 'disetujui', $user, 'store_wah_preparation_partial',
                ['jumlah_pekerja' => count($data['workers'])]
            );

            return response()->json([
                'message' => 'Persiapan WAH tersimpan. Lengkapi juga Identifikasi Bahaya (PTW) sebelum dikirim ke IA.',
                'data'    => $permit->load('wahWorkers'),
            ]);
        }

        $permit->update(['status' => 'menunggu_penerbitan']);
        $this->service->recordTransition(
            $permit, 'disetujui', 'menunggu_penerbitan', $user, 'store_wah_preparation',
            [
                'nomor_jsa'                => $data['nomor_jsa'] ?? null,
                'wah_menggunakan_perancah' => $request->boolean('wah_menggunakan_perancah'),
                'jumlah_pekerja'           => count($data['workers']),
            ]
        );

        $this->notif(
            $permit->issuing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} (WAH): Persiapan telah diisi PA (daftar pekerja & peralatan). Menunggu Penerbitan.",
            kirimEmail: true
        );

        return response()->json([
            'message' => 'Persiapan WAH tersimpan. Menunggu Penerbitan.',
            'data'    => $permit->load('wahWorkers'),
        ]);
    }

    /**
     * IA memeriksa & boleh mengedit Persiapan WAH yang diisi PA (Bagian 3),
     * dilakukan saat izin sudah MENUNGGU_PENERBITAN — sejajar dengan
     * HazardController::update() untuk Identifikasi Bahaya PTW.
     * File JSA/Scaffolding lama dipertahankan bila IA tidak mengunggah file baru.
     */
    public function update(StoreWahPreparationRequest $request, Permit $permit)
    {
        $user = $request->user();

        if (! $this->service->isWah($permit)) {
            return response()->json(['message' => 'Endpoint ini khusus izin WAH (Work at Height).'], 422);
        }
        if (! $this->ditugaskan($permit->issuing_authority_id, $user->id)) {
            return response()->json(['message' => 'Izin ini ditujukan kepada Issuing Authority lain.'], 403);
        }
        if ($permit->status !== 'menunggu_penerbitan') {
            return response()->json(['message' => 'Pemeriksaan Persiapan WAH hanya dapat dilakukan saat izin menunggu penerbitan.'], 422);
        }

        $data = $request->validated();

        $jsaPath = $request->hasFile('jsa_file')
            ? $request->file('jsa_file')->store('wah/jsa/' . $permit->id, 'public')
            : $permit->jsa_file_path;

        $scaffoldingPath = $request->hasFile('wah_scaffolding_cert_file')
            ? $request->file('wah_scaffolding_cert_file')->store('wah/scaffolding/' . $permit->id, 'public')
            : $permit->wah_scaffolding_cert_file_path;

        DB::transaction(function () use ($permit, $request, $data, $jsaPath, $scaffoldingPath) {
            $permit->update([
                'nomor_jsa'                      => $data['nomor_jsa'] ?? null,
                'jsa_file_path'                  => $jsaPath,
                'wah_menggunakan_perancah'       => $request->boolean('wah_menggunakan_perancah'),
                'wah_scaffolding_cert_nomor'     => $data['wah_scaffolding_cert_nomor'] ?? null,
                'wah_scaffolding_cert_file_path' => $scaffoldingPath,
                'wah_peralatan'                  => $data['peralatan'] ?? [],
                'wah_peralatan_lainnya'          => $data['peralatan_lainnya'] ?? null,
            ]);

            $permit->wahWorkers()->delete();
            foreach ($data['workers'] as $w) {
                $permit->wahWorkers()->create([
                    'nama_pekerja'    => $w['nama_pekerja'],
                    'sudah_pelatihan' => (bool) $w['sudah_pelatihan'],
                ]);
            }
        });

        $this->service->recordTransition(
            $permit, 'menunggu_penerbitan', 'menunggu_penerbitan', $user, 'review_wah_preparation'
        );

        return response()->json([
            'message' => 'Pemeriksaan Persiapan WAH oleh IA tersimpan.',
            'data'    => $permit->load('wahWorkers'),
        ]);
    }
}
