<?php

namespace Tests\Feature;

use Laravel\Sanctum\Sanctum;

/**
 * Uji gas = PENCATATAN MURNI.
 * Sistem hanya menyimpan angka hasil pengukuran; tidak menilai aman/tidak
 * dan tidak memblokir penerbitan. Penilaian kondisi aman adalah wewenang IA.
 */
class GasTestTest extends ApiTestCase
{
    public function test_agt_dapat_mencatat_hasil_uji_gas(): void
    {
        ['id' => $id] = $this->buatIzinDisetujui();

        $this->actingAsRole('AGT');
        $this->postJson("/api/permits/{$id}/gas-tests", [
            'oksigen_persen' => 20.9,
            'lel_persen'     => 1.0,
            'co_ppm'         => 5,
            'h2s_ppm'        => 2,
        ])->assertCreated()
          ->assertJsonPath('data.oksigen_persen', '20.90')
          ->assertJsonPath('data.lel_persen', '1.00');

        $this->assertDatabaseHas('gas_tests', [
            'permit_id'      => $id,
            'oksigen_persen' => 20.90,
            'lel_persen'     => 1.00,
        ]);
    }

    /** Angka di luar ambang SOP tetap DICATAT — tidak ada penolakan. */
    public function test_angka_di_luar_ambang_tetap_dicatat(): void
    {
        ['id' => $id] = $this->buatIzinDisetujui();

        $this->actingAsRole('AGT');
        $this->postJson("/api/permits/{$id}/gas-tests", [
            'oksigen_persen' => 15.0,  // di bawah 19.5
            'lel_persen'     => 40.0,  // jauh di atas 10
        ])->assertCreated();

        $this->assertDatabaseHas('gas_tests', [
            'permit_id'  => $id,
            'lel_persen' => 40.00,
        ]);
    }

    public function test_ia_juga_dapat_mencatat_hasil_uji_gas(): void
    {
        ['id' => $id, 'ia' => $ia] = $this->buatIzinDisetujui();

        Sanctum::actingAs($ia);
        $this->postJson("/api/permits/{$id}/gas-tests", [
            'oksigen_persen' => 20.9,
            'lel_persen'     => 1.0,
        ])->assertCreated();

        $this->assertDatabaseCount('gas_tests', 1);
    }

    public function test_uji_gas_ditolak_bila_izin_masih_draft(): void
    {
        ['id' => $id] = $this->buatIzinDraft();

        $this->actingAsRole('AGT');
        $this->postJson("/api/permits/{$id}/gas-tests", [
            'oksigen_persen' => 20.9,
            'lel_persen'     => 1.0,
        ])->assertStatus(422);
    }

    public function test_peran_lain_tidak_dapat_mencatat_uji_gas(): void
    {
        ['id' => $id] = $this->buatIzinDisetujui();

        $this->actingAsRole('AA'); // bukan AGT / IA
        $this->postJson("/api/permits/{$id}/gas-tests", [
            'oksigen_persen' => 20.9,
            'lel_persen'     => 1.0,
        ])->assertStatus(403);
    }
}
