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
 * PA mengisi JSA (opsional), Scaffolding Certificate (jika pakai perancah),
 * daftar pekerja di ketinggian, dan checklist peralatan khusus.
 *
 * Izin GABUNGAN (mis. CWP + WAH): status baru maju ke menunggu_penerbitan
 * setelah SELURUH Bagian 3 dari SEMUA jenis izin lengkap. Urutan bebas.
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

        // Maju ke penerbitan HANYA jika seluruh Bagian 3 dari semua jenis izin lengkap.
        $lanjut = $this->service->bagian3Lengkap($permit->fresh());

        if ($lanjut) {
            $permit->update(['status' => 'menunggu_penerbitan']);
        }

        $this->service->recordTransition(
            $permit,
            'menunggu_persiapan_pa',
            $lanjut ? 'menunggu_penerbitan' : 'menunggu_persiapan_pa',
            $user,
            'store_wah_preparation',
            [
                'nomor_jsa'                => $data['nomor_jsa'] ?? null,
                'wah_menggunakan_perancah' => $request->boolean('wah_menggunakan_perancah'),
                'jumlah_pekerja'           => count($data['workers']),
            ]
        );

        if ($lanjut) {
            $this->notif(
                $permit->issuing_authority_id,
                $permit->id,
                "Izin {$permit->nomor_izin}: seluruh Bagian 3 lengkap. Menunggu Penerbitan."
            );
        }

        return response()->json([
            'message' => $lanjut
                ? 'Persiapan WAH tersimpan. Menunggu Penerbitan.'
                : 'Persiapan WAH tersimpan. Lengkapi bagian jenis izin lainnya sebelum dapat diterbitkan.',
            'data'    => $permit->load('wahWorkers'),
        ]);
    }
}
