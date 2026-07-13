<?php

namespace Tests\Feature;

use Laravel\Sanctum\Sanctum;

/**
 * STEP 26 — Bagian 3: Identifikasi Bahaya dan Pengendalian.
 * Alur: AA setujui -> PA isi Bagian 3 -> IA periksa (boleh ubah) -> IA terbitkan.
 */
class HazardTest extends ApiTestCase
{
    public function test_daftar_bahaya_berbeda_per_jenis_izin(): void
    {
        ['id' => $id] = $this->buatIzinDraft(); // HWP

        $res = $this->getJson("/api/permits/{$id}/hazard-options")->assertOk();

        // Satu kelompok (HWP) berisi 21 item bahaya.
        $res->assertJsonCount(1, 'data');
        $this->assertCount(21, $res->json('data.0.hazards'));

        // Item 19 khusus Hot Work.
        $deskripsi = collect($res->json('data.0.hazards'))->firstWhere('no_bahaya', 19)['deskripsi'];
        $this->assertStringContainsString('Flammables', $deskripsi);
    }

    public function test_pa_melengkapi_bagian_3_mengubah_status_ke_menunggu_penerbitan(): void
    {
        ['id' => $id, 'pa' => $pa, 'ia' => $ia] = $this->buatIzinDisetujui();

        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/hazards", [
            'hazards' => [[
                'permit_type_id' => $this->idPermitType('HWP'),
                'no_bahaya'      => [1, 4, 20],
            ]],
            'nomor_jsa'      => 'JSA-2026-001',
            'tingkat_risiko' => 'tinggi',
            'bahaya_lainnya' => 'Area sempit dekat pipa gas.',
        ])->assertOk();

        $this->assertDatabaseHas('permits', [
            'id'             => $id,
            'status'         => 'menunggu_penerbitan',
            'nomor_jsa'      => 'JSA-2026-001',
            'tingkat_risiko' => 'tinggi',
        ]);

        $this->assertDatabaseCount('hazards', 3);
        $this->assertDatabaseHas('hazards', [
            'permit_id'      => $id,
            'permit_type_id' => $this->idPermitType('HWP'),
            'no_bahaya'      => 20,
            'deskripsi'      => 'Spark/percikan bunga api',
        ]);

        // IA diberi tahu bahwa izin siap diperiksa & diterbitkan.
        $this->assertDatabaseHas('notifications', ['user_id' => $ia->id, 'permit_id' => $id]);
    }

    public function test_tingkat_risiko_wajib_diisi(): void
    {
        ['id' => $id, 'pa' => $pa] = $this->buatIzinDisetujui();

        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/hazards", [
            'hazards' => [[
                'permit_type_id' => $this->idPermitType('HWP'),
                'no_bahaya'      => [1],
            ]],
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['tingkat_risiko']);
    }

    public function test_ia_dapat_menambah_dan_menghapus_bahaya(): void
    {
        ['id' => $id, 'pa' => $pa, 'ia' => $ia] = $this->buatIzinDisetujui();

        // PA menandai bahaya 1 & 4
        Sanctum::actingAs($pa);
        $this->lengkapiBahaya($id, [$this->idPermitType('HWP')], [1, 4]);
        $this->assertDatabaseCount('hazards', 2);

        // IA memeriksa: hapus 4, tambah 12 & 19
        Sanctum::actingAs($ia);
        $this->putJson("/api/permits/{$id}/hazards", [
            'hazards' => [[
                'permit_type_id' => $this->idPermitType('HWP'),
                'no_bahaya'      => [1, 12, 19],
            ]],
            'tingkat_risiko' => 'tinggi',
        ])->assertOk();

        $this->assertDatabaseCount('hazards', 3);
        $this->assertDatabaseHas('hazards', ['permit_id' => $id, 'no_bahaya' => 19]);
        $this->assertDatabaseMissing('hazards', ['permit_id' => $id, 'no_bahaya' => 4]);

        // status tetap menunggu_penerbitan
        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_penerbitan']);
    }

    public function test_izin_tidak_dapat_diterbitkan_sebelum_bagian_3_diisi(): void
    {
        ['id' => $id, 'ia' => $ia] = $this->buatIzinDisetujui();

        // IA langsung menerbitkan tanpa PA mengisi Bagian 3 -> ditolak
        Sanctum::actingAs($ia);
        $this->postJson("/api/permits/{$id}/issue")->assertStatus(422);

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'disetujui']);
    }

    public function test_pa_bukan_pemilik_tidak_bisa_mengisi_bagian_3(): void
    {
        ['id' => $id] = $this->buatIzinDisetujui();

        $this->actingAsRole('PA'); // PA lain
        $this->postJson("/api/permits/{$id}/hazards", [
            'hazards' => [[
                'permit_type_id' => $this->idPermitType('HWP'),
                'no_bahaya'      => [1],
            ]],
            'tingkat_risiko' => 'rendah',
        ])->assertStatus(403);
    }

    public function test_izin_multi_jenis_menampilkan_dua_kelompok_bahaya(): void
    {
        $aa = $this->userWithRole('AA');
        $ia = $this->userWithRole('IA');

        $this->actingAsRole('PA');
        $id = $this->postJson('/api/permits', [
            'permit_type_ids'       => [$this->idPermitType('HWP'), $this->idPermitType('CWP')],
            'lokasi'                => 'Area A',
            'deskripsi_pekerjaan'   => 'Pekerjaan gabungan',
            'approval_authority_id' => $aa->id,
            'issuing_authority_id'  => $ia->id,
        ])->json('data.id');

        $res = $this->getJson("/api/permits/{$id}/hazard-options")->assertOk();

        $res->assertJsonCount(2, 'data');

        // Item 19 berbeda: HWP = Flammables, CWP = Rigging
        $semua = collect($res->json('data'));
        $hwp = $semua->firstWhere('permit_type.kode', 'HWP');
        $cwp = $semua->firstWhere('permit_type.kode', 'CWP');

        $this->assertStringContainsString(
            'Flammables',
            collect($hwp['hazards'])->firstWhere('no_bahaya', 19)['deskripsi']
        );
        $this->assertStringContainsString(
            'Rigging',
            collect($cwp['hazards'])->firstWhere('no_bahaya', 19)['deskripsi']
        );
    }

    /**
     * REGRESI — nomor bahaya yang SAMA boleh muncul di dua jenis izin
     * (mis. bahaya 01 Confined Space ada di HWP dan CWP).
     */
    public function test_bahaya_bernomor_sama_boleh_ada_di_dua_jenis_izin(): void
    {
        $aa = $this->userWithRole('AA');
        $ia = $this->userWithRole('IA');

        $pa = $this->actingAsRole('PA');
        $id = $this->postJson('/api/permits', [
            'permit_type_ids'       => [$this->idPermitType('HWP'), $this->idPermitType('CWP')],
            'lokasi'                => 'Area A',
            'deskripsi_pekerjaan'   => 'Pekerjaan gabungan',
            'approval_authority_id' => $aa->id,
            'issuing_authority_id'  => $ia->id,
        ])->json('data.id');

        $this->postJson("/api/permits/{$id}/submit")->assertOk();

        Sanctum::actingAs($aa);
        $this->postJson("/api/permits/{$id}/approve", [
            'psb' => [
                ['permit_type_id' => $this->idPermitType('HWP'), 'psb_type_ids' => [$this->idPsbType('PSB-6')]],
                ['permit_type_id' => $this->idPermitType('CWP'), 'psb_type_ids' => [$this->idPsbType('PSB-6')]],
            ],
        ])->assertOk();

        // Bahaya 01 & 04 ditandai pada KEDUA jenis -> harus DITERIMA.
        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/hazards", [
            'hazards' => [
                ['permit_type_id' => $this->idPermitType('HWP'), 'no_bahaya' => [1, 4]],
                ['permit_type_id' => $this->idPermitType('CWP'), 'no_bahaya' => [1, 4]],
            ],
            'tingkat_risiko' => 'sedang',
        ])->assertOk();

        $this->assertDatabaseCount('hazards', 4);
        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_penerbitan']);
    }
}
