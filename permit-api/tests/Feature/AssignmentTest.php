<?php

namespace Tests\Feature;

use Laravel\Sanctum\Sanctum;

/**
 * STEP 24 — Penugasan AA & IA.
 * PA menentukan AA & IA yang dituju; hanya mereka yang boleh memproses izin.
 */
class AssignmentTest extends ApiTestCase
{
    public function test_pengajuan_wajib_menunjuk_aa_dan_ia(): void
    {
        $this->actingAsRole('PA');

        $this->postJson('/api/permits', [
            'permit_type_ids'     => [$this->idPermitType('HWP')],
            'lokasi'              => 'Area A',
            'deskripsi_pekerjaan' => 'Kerja',
            // approval_authority_id & issuing_authority_id sengaja tidak dikirim
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['approval_authority_id', 'issuing_authority_id']);
    }

    public function test_tidak_bisa_menunjuk_user_yang_bukan_aa(): void
    {
        $bukanAa = $this->userWithRole('PA'); // PA, bukan AA
        $ia      = $this->userWithRole('IA');

        $this->actingAsRole('PA');
        $this->postJson('/api/permits', [
            'permit_type_ids'       => [$this->idPermitType('HWP')],
            'lokasi'                => 'Area A',
            'deskripsi_pekerjaan'   => 'Kerja',
            'approval_authority_id' => $bukanAa->id,
            'issuing_authority_id'  => $ia->id,
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['approval_authority_id']);
    }

    public function test_aa_lain_tidak_bisa_approve_izin_yang_bukan_untuknya(): void
    {
        ['id' => $id, 'pa' => $pa] = $this->buatIzinDraft();

        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/submit")->assertOk();

        // AA LAIN (tidak ditugaskan) mencoba menyetujui -> ditolak
        $this->actingAsRole('AA');
        $this->postJson("/api/permits/{$id}/approve", [
            'psb' => [[
                'permit_type_id' => $this->idPermitType('HWP'),
                'psb_type_ids'   => [$this->idPsbType('PSB-6')],
            ]],
        ])->assertStatus(403);

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_approval']);
    }

    public function test_ia_lain_tidak_bisa_menerbitkan_izin_yang_bukan_untuknya(): void
    {
        ['id' => $id, 'pa' => $pa] = $this->buatIzinDisetujui();

        Sanctum::actingAs($pa);
        $this->lengkapiBahaya($id, [$this->idPermitType('HWP')]);

        // IA LAIN (tidak ditugaskan) mencoba menerbitkan -> ditolak
        $this->actingAsRole('IA');
        $this->postJson("/api/permits/{$id}/issue")->assertStatus(403);

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_penerbitan']);
    }

    public function test_notifikasi_berantai_ke_aa_lalu_ke_ia(): void
    {
        ['id' => $id, 'pa' => $pa, 'aa' => $aa, 'ia' => $ia] = $this->buatIzinDraft();

        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/submit")->assertOk();

        // AA yang ditunjuk dapat notifikasi
        $this->assertDatabaseHas('notifications', ['user_id' => $aa->id, 'permit_id' => $id, 'dibaca' => false]);
        // IA belum
        $this->assertDatabaseMissing('notifications', ['user_id' => $ia->id, 'permit_id' => $id]);

        Sanctum::actingAs($aa);
        $this->postJson("/api/permits/{$id}/approve", [
            'psb' => [[
                'permit_type_id' => $this->idPermitType('HWP'),
                'psb_type_ids'   => [$this->idPsbType('PSB-6')],
            ]],
        ])->assertOk();

        // setelah disetujui, IA otomatis dapat notifikasi
        $this->assertDatabaseHas('notifications', ['user_id' => $ia->id, 'permit_id' => $id, 'dibaca' => false]);
        // PA juga diberi tahu izinnya disetujui
        $this->assertDatabaseHas('notifications', ['user_id' => $pa->id, 'permit_id' => $id]);
    }

    public function test_inbox_hanya_menampilkan_izin_yang_ditujukan_ke_saya(): void
    {
        ['id' => $id, 'aa' => $aa] = $this->buatIzinDraft();

        // AA yang ditugaskan -> izin muncul di inbox-nya
        Sanctum::actingAs($aa);
        $this->getJson('/api/permits?scope=inbox')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // AA lain -> inbox kosong
        $this->actingAsRole('AA');
        $this->getJson('/api/permits?scope=inbox')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // tanpa scope -> papan izin, semua terlihat
        $this->getJson('/api/permits')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_daftar_user_per_role(): void
    {
        $this->userWithRole('AA');
        $this->userWithRole('AA');
        $this->userWithRole('IA');

        $this->actingAsRole('PA');

        $this->getJson('/api/users?role=AA')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure(['data' => [['id', 'name', 'jabatan']]]);

        $this->getJson('/api/users?role=IA')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
