<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

/**
 * STEP 25 — Satu izin dapat mencakup beberapa jenis izin sekaligus.
 * Nomor izin: 1 jenis -> HWP/2026/0001 ; >=2 jenis -> PTW/2026/0001
 * PSB ditetapkan PER JENIS oleh AA.
 */
class MultiPermitTypeTest extends ApiTestCase
{
    /** Buat izin multi-jenis (HWP + WAH). Mengembalikan [id, pa, aa, ia]. */
    private function buatIzinMulti(): array
    {
        $aa = $this->userWithRole('AA');
        $ia = $this->userWithRole('IA');

        $pa = $this->actingAsRole('PA');
        $id = $this->postJson('/api/permits', [
            'permit_type_ids'       => [$this->idPermitType('HWP'), $this->idPermitType('WAH')],
            'lokasi'                => 'Area Tangki T-101',
            'deskripsi_pekerjaan'   => 'Pengelasan pada ketinggian',
            'approval_authority_id' => $aa->id,
            'issuing_authority_id'  => $ia->id,
        ])->assertCreated()->json('data.id');

        return ['id' => $id, 'pa' => $pa, 'aa' => $aa, 'ia' => $ia];
    }

    public function test_izin_dapat_mencakup_dua_jenis_sekaligus(): void
    {
        ['id' => $id] = $this->buatIzinMulti();

        // dua baris pivot tercatat
        $this->assertDatabaseCount('permit_permit_type', 2);
        $this->assertDatabaseHas('permit_permit_type', [
            'permit_id'      => $id,
            'permit_type_id' => $this->idPermitType('HWP'),
        ]);
        $this->assertDatabaseHas('permit_permit_type', [
            'permit_id'      => $id,
            'permit_type_id' => $this->idPermitType('WAH'),
        ]);
    }

    public function test_nomor_izin_multi_jenis_memakai_prefiks_ptw(): void
    {
        ['id' => $id] = $this->buatIzinMulti();

        $nomor = DB::table('permits')->where('id', $id)->value('nomor_izin');

        $this->assertStringStartsWith('PTW/', $nomor);
    }

    public function test_nomor_izin_satu_jenis_tetap_memakai_kode_jenis(): void
    {
        ['id' => $id] = $this->buatIzinDraft(); // helper: 1 jenis (HWP)

        $nomor = DB::table('permits')->where('id', $id)->value('nomor_izin');

        $this->assertStringStartsWith('HWP/', $nomor);
    }

    public function test_pengajuan_tanpa_jenis_izin_ditolak(): void
    {
        $aa = $this->userWithRole('AA');
        $ia = $this->userWithRole('IA');

        $this->actingAsRole('PA');
        $this->postJson('/api/permits', [
            'permit_type_ids'       => [],
            'lokasi'                => 'Area A',
            'deskripsi_pekerjaan'   => 'Kerja',
            'approval_authority_id' => $aa->id,
            'issuing_authority_id'  => $ia->id,
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['permit_type_ids']);
    }

    public function test_aa_wajib_menetapkan_psb_untuk_setiap_jenis(): void
    {
        ['id' => $id, 'pa' => $pa, 'aa' => $aa] = $this->buatIzinMulti();

        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/submit")->assertOk();

        // AA hanya mengisi PSB untuk HWP, WAH dilewatkan -> ditolak
        Sanctum::actingAs($aa);
        $this->postJson("/api/permits/{$id}/approve", [
            'psb' => [[
                'permit_type_id' => $this->idPermitType('HWP'),
                'psb_type_ids'   => [$this->idPsbType('PSB-6')],
            ]],
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['psb']);

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_approval']);
    }

    public function test_psb_tersimpan_terpisah_per_jenis_izin(): void
    {
        ['id' => $id, 'pa' => $pa, 'aa' => $aa] = $this->buatIzinMulti();

        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/submit")->assertOk();

        Sanctum::actingAs($aa);
        $this->postJson("/api/permits/{$id}/approve", [
            'psb' => [
                [
                    'permit_type_id' => $this->idPermitType('HWP'),
                    'psb_type_ids'   => [$this->idPsbType('PSB-6')],
                ],
                [
                    'permit_type_id' => $this->idPermitType('WAH'),
                    'psb_type_ids'   => [$this->idPsbType('PSB-1'), $this->idPsbType('PSB-2')],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'disetujui']);

        // 1 PSB untuk HWP, 2 PSB untuk WAH
        $this->assertDatabaseCount('psb_forms', 3);
        $this->assertDatabaseHas('psb_forms', [
            'permit_id'      => $id,
            'permit_type_id' => $this->idPermitType('HWP'),
            'psb_type_id'    => $this->idPsbType('PSB-6'),
        ]);
        $this->assertDatabaseHas('psb_forms', [
            'permit_id'      => $id,
            'permit_type_id' => $this->idPermitType('WAH'),
            'psb_type_id'    => $this->idPsbType('PSB-1'),
        ]);
    }

    /**
     * REGRESI — PSB yang SAMA boleh dipakai pada dua jenis izin berbeda.
     * (Sebelumnya rule 'distinct' salah menandainya sebagai duplikat.)
     */
    public function test_psb_sama_boleh_dipakai_pada_dua_jenis_izin(): void
    {
        ['id' => $id, 'pa' => $pa, 'aa' => $aa] = $this->buatIzinMulti();

        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/submit")->assertOk();

        // PSB-6 dipakai untuk HWP maupun WAH -> harus DITERIMA.
        Sanctum::actingAs($aa);
        $this->postJson("/api/permits/{$id}/approve", [
            'psb' => [
                [
                    'permit_type_id' => $this->idPermitType('HWP'),
                    'psb_type_ids'   => [$this->idPsbType('PSB-6')],
                ],
                [
                    'permit_type_id' => $this->idPermitType('WAH'),
                    'psb_type_ids'   => [$this->idPsbType('PSB-6')],
                ],
            ],
        ])->assertOk();

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'disetujui']);
        $this->assertDatabaseCount('psb_forms', 2);
    }

    /** PSB terduplikasi DI DALAM satu jenis izin tetap ditolak. */
    public function test_psb_duplikat_dalam_satu_jenis_ditolak(): void
    {
        ['id' => $id, 'pa' => $pa, 'aa' => $aa] = $this->buatIzinMulti();

        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/submit")->assertOk();

        $psb6 = $this->idPsbType('PSB-6');

        Sanctum::actingAs($aa);
        $this->postJson("/api/permits/{$id}/approve", [
            'psb' => [
                [
                    'permit_type_id' => $this->idPermitType('HWP'),
                    'psb_type_ids'   => [$psb6, $psb6], // duplikat dalam kelompok yang sama
                ],
                [
                    'permit_type_id' => $this->idPermitType('WAH'),
                    'psb_type_ids'   => [$psb6],
                ],
            ],
        ])->assertStatus(422);
    }
}
