<?php

namespace Tests\Feature;

class GasTestTest extends ApiTestCase
{
    private function ujiGas(int $id, array $nilai): \Illuminate\Testing\TestResponse
    {
        $this->actingAsRole('AGT');
        return $this->postJson("/api/permits/{$id}/gas-tests", $nilai);
    }

    public function test_nilai_batas_aman(): void
    {
        ['id' => $id] = $this->buatIzinDisetujui();
        $this->ujiGas($id, ['oksigen_persen' => 19.5, 'lel_persen' => 9.9, 'co_ppm' => 34, 'h2s_ppm' => 9])
            ->assertCreated()->assertJsonPath('data.hasil_aman', true);
    }

    public function test_oksigen_terlalu_rendah_tidak_aman(): void
    {
        ['id' => $id] = $this->buatIzinDisetujui();
        $this->ujiGas($id, ['oksigen_persen' => 19.4, 'lel_persen' => 1])
            ->assertCreated()->assertJsonPath('data.hasil_aman', false);
    }

    public function test_lel_terlalu_tinggi_tidak_aman(): void
    {
        ['id' => $id] = $this->buatIzinDisetujui();
        $this->ujiGas($id, ['oksigen_persen' => 20.9, 'lel_persen' => 10])
            ->assertCreated()->assertJsonPath('data.hasil_aman', false);
    }

    public function test_co_dan_h2s_null_tetap_aman_bila_o2_lel_ok(): void
    {
        ['id' => $id] = $this->buatIzinDisetujui();
        $this->ujiGas($id, ['oksigen_persen' => 20.9, 'lel_persen' => 1])
            ->assertCreated()->assertJsonPath('data.hasil_aman', true);
    }

    public function test_agt_wajib_isi_oksigen_dan_lel(): void
    {
        ['id' => $id] = $this->buatIzinDisetujui();
        $this->ujiGas($id, ['oksigen_persen' => 20.9])   // lel tidak diisi
            ->assertStatus(422);
    }
}
