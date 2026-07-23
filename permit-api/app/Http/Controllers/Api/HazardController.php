<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreHazardRequest;
use App\Models\Hazard;
use App\Models\Notification;
use App\Models\HazardType;
use App\Models\Permit;
use App\Services\PermitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HazardController extends Controller
{
    public function __construct(private PermitService $service)
    {
    }

    /**
     * Master daftar bahaya untuk izin ini, dikelompokkan per jenis izin
     * (HWP & CWP punya daftar berbeda pada item 19-20).
     */
    public function options(Permit $permit)
    {
        $typeIds = $permit->permitTypes()->pluck('permit_types.id');

        // Fallback izin lama (belum punya baris pivot).
        if ($typeIds->isEmpty() && $permit->permit_type_id) {
            $typeIds = collect([$permit->permit_type_id]);
        }

        $data = HazardType::with('permitType:id,kode,nama')
            ->whereIn('permit_type_id', $typeIds)
            ->orderBy('permit_type_id')
            ->orderBy('no_bahaya')
            ->get()
            ->groupBy('permit_type_id')
            ->map(fn ($items) => [
                'permit_type' => $items->first()->permitType,
                'hazards'     => $items->map(fn ($h) => [
                    'no_bahaya' => $h->no_bahaya,
                    'deskripsi' => $h->deskripsi,
                ])->values(),
            ])
            ->values();

        return response()->json(['data' => $data]);
    }

    /**
     * PA melengkapi Bagian 3 (disetujui -> menunggu_penerbitan).
     */
    public function store(StoreHazardRequest $request, Permit $permit)
    {
        $user = $request->user();

        if ((int) $permit->performing_authority_id !== (int) $user->id) {
            return response()->json(['message' => 'Hanya PA pemilik yang dapat melengkapi identifikasi bahaya.'], 403);
        }

        // Izin GABUNGAN (mis. CWP + WAH) bisa sudah bergeser ke menunggu_persiapan_pa
        // karena alur WAH. Bagian bahaya tetap harus bisa diisi — urutan bebas.
        if (! in_array($permit->status, ['disetujui', 'menunggu_persiapan_pa'], true)) {
            return response()->json([
                'message' => 'Identifikasi bahaya hanya dapat diisi setelah izin disetujui AA.',
            ], 422);
        }

        $statusLama = $permit->status;

        $this->simpanBahaya($permit, $request->validated());

        $permit->update(['hazard_diisi_at' => now()]);

        // Maju ke penerbitan HANYA jika seluruh Bagian 3 dari semua jenis izin lengkap.
        $lanjut = $this->service->bagian3Lengkap($permit->fresh());

        if ($lanjut) {
            $permit->update(['status' => 'menunggu_penerbitan']);
            $this->service->recordTransition(
                $permit, $statusLama, 'menunggu_penerbitan', $user, 'submit_hazards'
            );
        } else {
            $this->service->recordTransition(
                $permit, $statusLama, $statusLama, $user, 'submit_hazards'
            );
        }

        // IA yang ditunjuk diberi tahu: siap diperiksa & diterbitkan.
        if ($lanjut && $permit->issuing_authority_id) {
            Notification::create([
                'user_id'   => $permit->issuing_authority_id,
                'permit_id' => $permit->id,
                'pesan'     => "Izin {$permit->nomor_izin} siap diperiksa dan diterbitkan.",
                'dibaca'    => false,
            ]);
        }

        return response()->json([
            'message' => $lanjut
                ? 'Identifikasi bahaya tersimpan. Izin menunggu pemeriksaan & penerbitan IA.'
                : 'Identifikasi bahaya tersimpan. Lengkapi bagian jenis izin lainnya sebelum dapat diterbitkan.',
            'data'    => $permit->load('hazards.permitType'),
        ]);
    }

    /**
     * IA memeriksa Bagian 3 — boleh menambah maupun menghapus centangan
     * (formulir: "dilengkapi oleh PA dan diperiksa oleh Issuing Authority - IA").
     */
    public function update(StoreHazardRequest $request, Permit $permit)
    {
        $user = $request->user();

        if ($permit->issuing_authority_id !== null
            && (int) $permit->issuing_authority_id !== (int) $user->id) {
            return response()->json(['message' => 'Izin ini ditujukan kepada Issuing Authority lain.'], 403);
        }

        if ($permit->status !== 'menunggu_penerbitan') {
            return response()->json([
                'message' => 'Pemeriksaan bahaya hanya dapat dilakukan saat izin menunggu penerbitan.',
            ], 422);
        }

        $this->simpanBahaya($permit, $request->validated());

        $this->service->recordTransition(
            $permit, 'menunggu_penerbitan', 'menunggu_penerbitan', $user, 'review_hazards'
        );

        return response()->json([
            'message' => 'Pemeriksaan bahaya oleh IA tersimpan.',
            'data'    => $permit->load('hazards.permitType'),
        ]);
    }

    /**
     * Tulis ulang daftar bahaya (replace) + field Bagian 3 pada izin.
     * Replace dipilih agar IA dapat MENAMBAH maupun MENGHAPUS centangan.
     */
    private function simpanBahaya(Permit $permit, array $data): void
    {
        DB::transaction(function () use ($permit, $data) {
            $permit->hazards()->delete();

            foreach ($data['hazards'] as $kelompok) {
                $typeId = $kelompok['permit_type_id'];

                $master = HazardType::where('permit_type_id', $typeId)
                    ->whereIn('no_bahaya', $kelompok['no_bahaya'])
                    ->get()
                    ->keyBy('no_bahaya');

                foreach ($kelompok['no_bahaya'] as $no) {
                    if (! isset($master[$no])) {
                        continue; // abaikan nomor yang tidak ada di master jenis tsb
                    }

                    Hazard::create([
                        'permit_id'      => $permit->id,
                        'permit_type_id' => $typeId,
                        'no_bahaya'      => $no,
                        'deskripsi'      => $master[$no]->deskripsi,
                    ]);
                }
            }

            $permit->update([
                'nomor_jsa'      => $data['nomor_jsa'] ?? null,
                'tingkat_risiko' => $data['tingkat_risiko'],
                'bahaya_lainnya' => $data['bahaya_lainnya'] ?? null,
            ]);
        });
    }
}
