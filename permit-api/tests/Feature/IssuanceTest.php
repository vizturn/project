<?php

namespace Tests\Feature;

use Laravel\Sanctum\Sanctum;

/**
 * STEP 27 — Bagian 4 (Referensi Pendukung), Bagian 5 (Penetapan Uji Gas),
 * Bagian 6 (Penerbitan), Bagian 7 (Penerimaan PTW oleh PA).
 *
 * Alur: menunggu_penerbitan -> IA isi Bagian 4 & 5 -> terbitkan
 *       -> menunggu_penerimaan -> PA terima -> aktif
 */
class IssuanceTest extends ApiTestCase
{
    /** Izin sampai status menunggu_penerbitan (Bagian 3 sudah diisi PA). */
    private function siapTerbit(): array
    {
        ['id' => $id, 'pa' => $pa, 'aa' => $aa, 'ia' => $ia] = $this->buatIzinDisetujui();

        Sanctum::actingAs($pa);
        $this->lengkapiBahaya($id, [$this->idPermitType('HWP')]);

        return ['id' => $id, 'pa' => $pa, 'aa' => $aa, 'ia' => $ia];
    }

    public function test_bagian_4_wajib_diisi_sebelum_penerbitan(): void
    {
        ['id' => $id, 'ia' => $ia] = $this->siapTerbit();

        // Belum mengisi Bagian 4 -> penerbitan ditolak
        Sanctum::actingAs($ia);
        $this->postJson("/api/permits/{$id}/issue")->assertStatus(422);

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_penerbitan']);
    }

    public function test_ia_mengisi_bagian_4_referensi_pendukung(): void
    {
        ['id' => $id, 'ia' => $ia] = $this->siapTerbit();

        Sanctum::actingAs($ia);
        $this->postJson("/api/permits/{$id}/references", [
            'ref_permit_cse'              => 'CSE/2026/0007',
            'cert_isolation'              => 'ISO-123',
            'cert_scaffolding'            => 'SCF-456',
            'sistem_safety_dinonaktifkan' => 'Fire & gas detector zona 3',
            'referensi_lainnya'           => 'MSDS, Lifting Plan',
        ])->assertOk();

        $this->assertDatabaseHas('permits', [
            'id'               => $id,
            'ref_permit_cse'   => 'CSE/2026/0007',
            'cert_isolation'   => 'ISO-123',
            'cert_scaffolding' => 'SCF-456',
        ]);

        // Penanda bahwa Bagian 4 telah dilengkapi.
        $this->assertNotNull(
            \App\Models\Permit::find($id)->referensi_diisi_at
        );
    }

    public function test_ia_menetapkan_uji_gas_dan_periode_wajib_diisi(): void
    {
        ['id' => $id, 'ia' => $ia] = $this->siapTerbit();

        Sanctum::actingAs($ia);

        // Ada gas ditandai tetapi periode kosong -> ditolak
        $this->postJson("/api/permits/{$id}/gas-requirement", [
            'gas_uji_flammable' => true,
            'gas_uji_oksigen'   => true,
            'gas_uji_beracun'   => false,
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['gas_periode_ulang']);

        // Dengan periode -> diterima
        $this->postJson("/api/permits/{$id}/gas-requirement", [
            'gas_uji_flammable' => true,
            'gas_uji_oksigen'   => true,
            'gas_uji_beracun'   => false,
            'gas_periode_ulang' => 'setiap 2 jam',
        ])->assertOk();

        $this->assertDatabaseHas('permits', [
            'id'                => $id,
            'gas_uji_flammable' => 1,
            'gas_uji_oksigen'   => 1,
            'gas_uji_beracun'   => 0,
            'gas_periode_ulang' => 'setiap 2 jam',
        ]);
    }

    public function test_ia_dapat_mengisi_hasil_uji_gas_sendiri(): void
    {
        ['id' => $id, 'ia' => $ia] = $this->siapTerbit();

        // IA (bukan AGT) mengisi hasil uji gas -> diizinkan (formulir: "oleh IA atau AGT")
        Sanctum::actingAs($ia);
        $this->postJson("/api/permits/{$id}/gas-tests", [
            'oksigen_persen' => 20.9,
            'lel_persen'     => 1.0,
        ])->assertCreated();

        $this->assertDatabaseCount('gas_tests', 1);
    }

    public function test_penerbitan_mengubah_status_menjadi_menunggu_penerimaan(): void
    {
        ['id' => $id, 'pa' => $pa, 'ia' => $ia] = $this->siapTerbit();

        Sanctum::actingAs($ia);
        $this->lengkapiReferensi($id);
        $this->postJson("/api/permits/{$id}/issue")->assertOk();

        // BUKAN langsung aktif — menunggu PA menerima PTW.
        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_penerimaan']);

        // PA diberi tahu untuk melakukan penerimaan.
        $this->assertDatabaseHas('notifications', ['user_id' => $pa->id, 'permit_id' => $id]);
    }

    public function test_pa_menerima_ptw_maka_izin_menjadi_aktif(): void
    {
        ['id' => $id, 'pa' => $pa, 'ia' => $ia] = $this->siapTerbit();

        Sanctum::actingAs($ia);
        $this->lengkapiReferensi($id);
        $this->postJson("/api/permits/{$id}/issue")->assertOk();

        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/accept", ['pernyataan' => true])->assertOk();

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'aktif']);
        $this->assertNotNull(\App\Models\Permit::find($id)->diterima_pa_at);

        // IA diberi tahu bahwa PTW telah diterima.
        $this->assertDatabaseHas('notifications', ['user_id' => $ia->id, 'permit_id' => $id]);
    }

    public function test_penerimaan_wajib_mencentang_pernyataan(): void
    {
        ['id' => $id, 'pa' => $pa, 'ia' => $ia] = $this->siapTerbit();

        Sanctum::actingAs($ia);
        $this->lengkapiReferensi($id);
        $this->postJson("/api/permits/{$id}/issue")->assertOk();

        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/accept", ['pernyataan' => false])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['pernyataan']);

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_penerimaan']);
    }

    public function test_pa_lain_tidak_bisa_menerima_ptw_milik_orang_lain(): void
    {
        ['id' => $id, 'ia' => $ia] = $this->siapTerbit();

        Sanctum::actingAs($ia);
        $this->lengkapiReferensi($id);
        $this->postJson("/api/permits/{$id}/issue")->assertOk();

        // PA lain (bukan pemilik) mencoba menerima -> ditolak
        $this->actingAsRole('PA');
        $this->postJson("/api/permits/{$id}/accept", ['pernyataan' => true])->assertStatus(403);

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_penerimaan']);
    }

    public function test_ia_lain_tidak_bisa_mengisi_bagian_4(): void
    {
        ['id' => $id] = $this->siapTerbit();

        // IA lain (tidak ditugaskan) -> ditolak
        $this->actingAsRole('IA');
        $this->postJson("/api/permits/{$id}/references", ['cert_isolation' => 'ISO-999'])
            ->assertStatus(403);
    }

    /**
     * Izin yang sudah diterbitkan namun TIDAK PERNAH diterima PA sampai masa
     * berlakunya habis harus KEDALUWARSA — tidak boleh menggantung selamanya.
     */
    public function test_izin_menunggu_penerimaan_ikut_kedaluwarsa(): void
    {
        ['id' => $id, 'ia' => $ia] = $this->siapTerbit();

        Sanctum::actingAs($ia);
        $this->lengkapiReferensi($id);
        $this->postJson("/api/permits/{$id}/issue")->assertOk();

        // Mundurkan masa berlaku ke masa lalu.
        \App\Models\Permit::where('id', $id)->update([
            'tgl_kadaluarsa' => now()->subHour(),
        ]);

        $this->artisan('permits:check-validity')->assertSuccessful();

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'kadaluarsa']);
    }
}
