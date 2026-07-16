<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AcceptPermitRequest;
use App\Http\Requests\ApprovePermitRequest;
use App\Http\Requests\RejectPermitRequest;
use App\Http\Requests\StorePermitRequest;
use App\Models\Notification;
use App\Models\Permit;
use App\Models\PermitType;
use App\Models\PsbForm;
use App\Models\Revalidation;
use App\Services\PermitService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PermitController extends Controller
{
    public function __construct(private PermitService $service)
    {
    }

    /** Daftar izin. PA lihat miliknya; AA/IA/SHE/ADM lihat semua. */
    public function index(Request $request)
    {
        $user  = $request->user();
        $scope = $request->query('scope'); // 'inbox' = hanya yang ditujukan ke saya

        $q = Permit::with([
            'permitTypes:id,kode,nama',
            'permitType:id,kode,nama',
            'performingAuthority:id,name',
            'approvalAuthority:id,name',
            'issuingAuthority:id,name',
        ])->latest();

        // Mode inbox: tampilkan izin yang relevan bagi peran user ini.
        if ($scope === 'inbox') {
            $q->where(function ($sub) use ($user) {
                $sub->where('performing_authority_id', $user->id);

                if ($user->hasRole('AA')) {
                    $sub->orWhere('approval_authority_id', $user->id);
                }
                if ($user->hasRole('IA')) {
                    $sub->orWhere('issuing_authority_id', $user->id);
                }
            });
        }

        return response()->json(['data' => $q->get()]);
    }

    /** Detail izin (boleh dilihat semua user terautentikasi). */
    public function show(Permit $permit)
    {
        $permit->load([
            'permitTypes',
            'permitType',
            'screening',
            'performingAuthority:id,name',
            'approvalAuthority:id,name',
            'issuingAuthority:id,name',
            'psbForms.psbType',
            'hazards.permitType:id,kode,nama',
            'psbForms.permitType:id,kode,nama',
            'gasTests.agt:id,name',
            'statusHistories',
            'liveAudits.auditor:id,name',
            'revalidations',
        ]);

        return response()->json(['data' => $permit]);
    }

    /** S11 — PA membuat pengajuan (draft). */
    public function store(StorePermitRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        $permit = DB::transaction(function () use ($user, $data) {
            // STEP 25 — satu izin bisa mencakup beberapa jenis sekaligus.
            $types = PermitType::whereIn('id', $data['permit_type_ids'])->get();

            $permit = Permit::create([
                'nomor_izin'              => $this->service->generateNomorIzin($types),
                // Jenis utama (pertama) tetap disimpan demi kompatibilitas data & rekap lama.
                'permit_type_id'          => $types->first()->id,
                'screening_id'            => $data['screening_id'] ?? null,
                'approval_authority_id'   => $data['approval_authority_id'],
                'issuing_authority_id'    => $data['issuing_authority_id'],
                'wo_id'                   => $data['wo_id'] ?? null,
                'equipment_id'            => $data['equipment_id'] ?? null,
                'performing_authority_id' => $user->id,
                'lokasi'                  => $data['lokasi'],
                'deskripsi_pekerjaan'     => $data['deskripsi_pekerjaan'],
                'durasi'                  => $data['durasi'] ?? null,
                'status'                  => 'draft',
            ]);

            $permit->permitTypes()->sync($types->pluck('id')->all());

            $this->service->recordTransition(
                $permit, null, 'draft', $user, 'create_permit',
                ['permit_type_ids' => $types->pluck('id')->all()]
            );

            return $permit;
        });

        return response()->json([
            'message' => 'Pengajuan izin dibuat (draft).',
            'data'    => $permit->load('permitTypes'),
        ], 201);
    }

    /** S11 — PA mengajukan (draft -> menunggu_approval). */
    public function submit(Request $request, Permit $permit)
    {
        $user = $request->user();

        if ((int) $permit->performing_authority_id !== (int) $user->id) {
            return response()->json(['message' => 'Hanya PA pemilik yang dapat mengajukan izin ini.'], 403);
        }
        if ($permit->status !== 'draft') {
            return response()->json(['message' => 'Izin hanya dapat diajukan dari status draft.'], 422);
        }

        $permit->update(['status' => 'menunggu_approval']);
        $this->service->recordTransition($permit, 'draft', 'menunggu_approval', $user, 'submit_permit');

        // Beritahu AA yang ditunjuk bahwa ada izin menunggu persetujuannya.
        $this->notif(
            $permit->approval_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} menunggu persetujuan Anda."
        );

        return response()->json(['message' => 'Izin diajukan untuk persetujuan.', 'data' => $permit]);
    }

    /** S12 — AA menyetujui + menetapkan PSB (menunggu_approval -> disetujui). */
    public function approve(ApprovePermitRequest $request, Permit $permit)
    {
        $user = $request->user();

        if ($permit->status !== 'menunggu_approval') {
            return response()->json(['message' => 'Izin tidak dalam status menunggu approval.'], 422);
        }

        if (! $this->ditugaskan($permit->approval_authority_id, $user->id)) {
            return response()->json(['message' => 'Izin ini ditujukan kepada Approval Authority lain.'], 403);
        }

        $data = $request->validated();

        DB::transaction(function () use ($permit, $user, $data) {
            // PSB ditetapkan PER JENIS IZIN (HWP punya PSB-nya, WAH punya PSB-nya).
            foreach ($data['psb'] as $kelompok) {
                foreach ($kelompok['psb_type_ids'] as $psbTypeId) {
                    PsbForm::create([
                        'permit_id'      => $permit->id,
                        'permit_type_id' => $kelompok['permit_type_id'],
                        'psb_type_id'    => $psbTypeId,
                        'diisi_oleh'     => null,
                        'status'         => 'ditetapkan',
                    ]);
                }
            }

            $permit->update([
                'status'                => 'disetujui',
                'approval_authority_id' => $user->id,
            ]);

            $this->service->recordTransition(
                $permit, 'menunggu_approval', 'disetujui', $user, 'approve_permit',
                ['psb' => $data['psb']]
            );
        });

        // Setelah disetujui: IA yang ditunjuk otomatis diberi tahu untuk menerbitkan.
        $this->notif(
            $permit->issuing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} disetujui AA. Menunggu PA melengkapi identifikasi bahaya."
        );
        $this->notif(
            $permit->performing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} DISETUJUI. Lengkapi Identifikasi Bahaya (Bagian 3)."
        );

        return response()->json([
            'message' => 'Izin disetujui dan PSB ditetapkan.',
            'data'    => $permit->load('psbForms.psbType', 'psbForms.permitType'),
        ]);
    }

    /** S12 — AA menolak (menunggu_approval -> ditolak). */
    public function reject(RejectPermitRequest $request, Permit $permit)
    {
        $user = $request->user();

        if ($permit->status !== 'menunggu_approval') {
            return response()->json(['message' => 'Izin tidak dalam status menunggu approval.'], 422);
        }

        if (! $this->ditugaskan($permit->approval_authority_id, $user->id)) {
            return response()->json(['message' => 'Izin ini ditujukan kepada Approval Authority lain.'], 403);
        }

        $alasan = $request->validated()['alasan'] ?? null;

        $permit->update(['status' => 'ditolak', 'approval_authority_id' => $user->id]);
        $this->service->recordTransition(
            $permit, 'menunggu_approval', 'ditolak', $user, 'reject_permit', ['alasan' => $alasan]
        );

        $this->notif(
            $permit->performing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} Anda DITOLAK." . ($alasan ? " Alasan: {$alasan}" : '')
        );

        return response()->json(['message' => 'Izin ditolak.', 'data' => $permit]);
    }

    /** S14 — IA menerbitkan (disetujui -> aktif). */
    public function issue(Request $request, Permit $permit)
    {
        $user = $request->user();

        // STEP 26 — penerbitan hanya setelah PA melengkapi Identifikasi Bahaya (Bagian 3).
        if ($permit->status !== 'menunggu_penerbitan') {
            return response()->json([
                'message' => 'Izin hanya dapat diterbitkan setelah PA melengkapi identifikasi bahaya (Bagian 3).',
            ], 422);
        }

        if (! $this->ditugaskan($permit->issuing_authority_id, $user->id)) {
            return response()->json(['message' => 'Izin ini ditujukan kepada Issuing Authority lain.'], 403);
        }

        // STEP 27 — Bagian 4 (Referensi Pendukung) WAJIB diisi sebelum penerbitan.
        if ($permit->referensi_diisi_at === null) {
            return response()->json([
                'message' => 'Bagian 4 (Referensi Pendukung) wajib dilengkapi sebelum penerbitan.',
            ], 422);
        }

        // STEP 28 — Uji gas TIDAK lagi memblokir penerbitan.
        // Hasil pengukuran hanya dicatat; penilaian kondisi aman adalah wewenang IA
        // (pernyataan Bagian 6). Uji gas sepenuhnya opsional.

        $now      = now();
        $kadaluar = $now->copy()->addHours(72);

        // Masa berlaku dihitung sejak PENERBITAN (sesuai formulir: "Berlaku tanggal ... s.d.").
        $permit->update([
            'status'               => 'menunggu_penerimaan',
            'issuing_authority_id' => $user->id,
            'tgl_terbit'           => $now,
            'tgl_kadaluarsa'       => $kadaluar,
        ]);

        $this->service->recordTransition(
            $permit, 'menunggu_penerbitan', 'menunggu_penerimaan', $user, 'issue_permit',
            ['tgl_terbit' => $now->toDateTimeString(), 'tgl_kadaluarsa' => $kadaluar->toDateTimeString()]
        );

        $this->notif(
            $permit->performing_authority_id,
            $permit->id,
            "Izin {$permit->nomor_izin} telah DITERBITKAN. Silakan lakukan Penerimaan PTW (Bagian 7)."
        );

        return response()->json([
            'message' => 'Izin diterbitkan. Menunggu Penerimaan PTW oleh PA.',
            'data'    => $permit,
        ]);
    }

    /** S16 — PA mengembalikan izin (aktif -> ditunda). */
    public function returnPermit(Request $request, Permit $permit)
    {
        $user = $request->user();

        if ((int) $permit->performing_authority_id !== (int) $user->id) {
            return response()->json(['message' => 'Hanya PA pemilik yang dapat mengembalikan izin.'], 403);
        }
        if ($permit->status !== 'aktif') {
            return response()->json(['message' => 'Hanya izin AKTIF yang dapat dikembalikan.'], 422);
        }

        Revalidation::create([
            'permit_id'   => $permit->id,
            'returned_at' => now(),
            'returned_by' => $user->id,
        ]);

        $permit->update(['status' => 'ditunda']);
        $this->service->recordTransition($permit, 'aktif', 'ditunda', $user, 'return_permit');

        return response()->json(['message' => 'Izin dikembalikan (DITUNDA).', 'data' => $permit]);
    }

    /** S16 — IA revalidasi (ditunda -> aktif). */
    public function revalidate(Request $request, Permit $permit)
    {
        $user = $request->user();

        if ($permit->status !== 'ditunda') {
            return response()->json(['message' => 'Hanya izin DITUNDA yang dapat direvalidasi.'], 422);
        }

        $rev = $permit->revalidations()->whereNull('revalidated_at')->latest('id')->first();
        if ($rev) {
            $rev->update(['revalidated_at' => now(), 'revalidated_by' => $user->id]);
        }

        $permit->update(['status' => 'aktif']);
        $this->service->recordTransition($permit, 'ditunda', 'aktif', $user, 'revalidate_permit');

        return response()->json(['message' => 'Izin direvalidasi (AKTIF).', 'data' => $permit]);
    }

    /** S17 — PA menyelesaikan pekerjaan (aktif -> selesai). */
    public function complete(Request $request, Permit $permit)
    {
        $user = $request->user();

        if ((int) $permit->performing_authority_id !== (int) $user->id) {
            return response()->json(['message' => 'Hanya PA pemilik yang dapat menyelesaikan pekerjaan.'], 403);
        }
        if ($permit->status !== 'aktif') {
            return response()->json(['message' => 'Hanya izin AKTIF yang dapat diselesaikan.'], 422);
        }

        $permit->update(['status' => 'selesai']);
        $this->service->recordTransition($permit, 'aktif', 'selesai', $user, 'complete_permit');

        return response()->json(['message' => 'Pekerjaan dinyatakan selesai.', 'data' => $permit]);
    }

    /** S17 — IA menutup izin (selesai -> closed). */
    public function close(Request $request, Permit $permit)
    {
        $user = $request->user();

        if ($permit->status !== 'selesai') {
            return response()->json(['message' => 'Hanya izin berstatus SELESAI yang dapat ditutup.'], 422);
        }

        $permit->update(['status' => 'closed']);
        $this->service->recordTransition($permit, 'selesai', 'closed', $user, 'close_permit');

        return response()->json(['message' => 'Izin ditutup (CLOSED).', 'data' => $permit]);
    }

    /**
     * STEP 27 — Bagian 7: Penerimaan PTW oleh PA (menunggu_penerimaan -> aktif).
     * PA menyatakan telah membaca & memahami izin serta menerima tanggung jawab.
     */
    public function accept(AcceptPermitRequest $request, Permit $permit)
    {
        $user = $request->user();

        if ((int) $permit->performing_authority_id !== (int) $user->id) {
            return response()->json(['message' => 'Hanya PA pemilik izin yang dapat menerima PTW ini.'], 403);
        }

        if ($permit->status !== 'menunggu_penerimaan') {
            return response()->json([
                'message' => 'Penerimaan PTW hanya dapat dilakukan setelah izin diterbitkan IA.',
            ], 422);
        }

        $permit->update([
            'status'         => 'aktif',
            'diterima_pa_at' => now(),
        ]);

        $this->service->recordTransition(
            $permit, 'menunggu_penerimaan', 'aktif', $user, 'accept_permit'
        );

        $this->notif(
            $permit->issuing_authority_id,
            $permit->id,
            "PTW {$permit->nomor_izin} telah diterima PA. Pekerjaan berstatus AKTIF."
        );

        return response()->json([
            'message' => 'PTW diterima. Izin berstatus AKTIF.',
            'data'    => $permit,
        ]);
    }

    /**
     * Cek apakah user berhak menangani izin yang ditugaskan kepadanya.
     * Kompatibel mundur: izin lama (sebelum fitur penugasan) bernilai null
     * -> siapa pun pemegang peran tersebut boleh memprosesnya.
     */
    private function ditugaskan(?int $ditugaskanKe, int $userId): bool
    {
        if ($ditugaskanKe === null) {
            return true;
        }

        return (int) $ditugaskanKe === (int) $userId;
    }

    /** Kirim notifikasi ke satu pengguna (diabaikan bila target kosong). */
    private function notif(?int $userId, int $permitId, string $pesan): void
    {
        if (! $userId) {
            return;
        }

        Notification::create([
            'user_id'   => $userId,
            'permit_id' => $permitId,
            'pesan'     => $pesan,
            'dibaca'    => false,
        ]);
    }
}
