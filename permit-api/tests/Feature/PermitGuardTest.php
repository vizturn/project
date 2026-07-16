<?php

namespace Tests\Feature;

use Laravel\Sanctum\Sanctum;

class PermitGuardTest extends ApiTestCase
{
    public function test_tidak_bisa_approve_dari_status_draft(): void
    {
        ['id' => $id, 'aa' => $aa] = $this->buatIzinDraft(); // belum submit

        Sanctum::actingAs($aa);
        $this->postJson("/api/permits/{$id}/approve", [
            'psb' => [[
                'permit_type_id' => $this->idPermitType('HWP'),
                'psb_type_ids'   => [$this->idPsbType('PSB-6')],
            ]],
        ])->assertStatus(422);
    }

    /**
     * STEP 28 — Uji gas TIDAK lagi memblokir penerbitan.
     * Angka di luar ambang tetap dicatat, dan IA tetap dapat menerbitkan izin
     * (penilaian kondisi aman adalah wewenangnya, sesuai pernyataan Bagian 6).
     */
    public function test_uji_gas_di_luar_ambang_tidak_memblokir_penerbitan(): void
    {
        ['id' => $id, 'pa' => $pa, 'ia' => $ia] = $this->buatIzinDisetujui();

        $this->actingAsRole('AGT');
        $this->postJson("/api/permits/{$id}/gas-tests", [
            'oksigen_persen' => 15.0, 'lel_persen' => 40.0,
        ])->assertCreated();

        Sanctum::actingAs($pa);
        $this->lengkapiBahaya($id, [$this->idPermitType('HWP')]);

        Sanctum::actingAs($ia);
        $this->lengkapiReferensi($id);
        $this->postJson("/api/permits/{$id}/issue")->assertOk();

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_penerimaan']);
    }

    public function test_pa_bukan_pemilik_tidak_bisa_submit(): void
    {
        ['id' => $id] = $this->buatIzinDraft();

        // PA lain mencoba submit
        $this->actingAsRole('PA');
        $this->postJson("/api/permits/{$id}/submit")->assertStatus(403);
    }

    public function test_non_aa_tidak_bisa_approve(): void
    {
        ['id' => $id] = $this->buatIzinDisetujui();

        $this->actingAsRole('PA');
        $this->postJson("/api/permits/{$id}/approve", [
            'psb' => [[
                'permit_type_id' => $this->idPermitType('HWP'),
                'psb_type_ids'   => [$this->idPsbType('PSB-6')],
            ]],
        ])->assertStatus(403);
    }
}
