<?php

namespace Tests\Feature;

class ScreeningTest extends ApiTestCase
{
    public function test_pa_buat_penapisan_dengan_kriteria_butuh_izin(): void
    {
        $this->actingAsRole('PA');

        $this->postJson('/api/screenings', ['checked_criteria' => [1, 3, 6]])
            ->assertCreated()
            ->assertJsonPath('data.butuh_izin', true);

        $this->assertDatabaseCount('screening_items', 3);
    }

    public function test_penapisan_tanpa_kriteria_tidak_butuh_izin(): void
    {
        $this->actingAsRole('PA');

        $this->postJson('/api/screenings', ['checked_criteria' => []])
            ->assertCreated()
            ->assertJsonPath('data.butuh_izin', false);
    }

    public function test_non_pa_dilarang_buat_penapisan(): void
    {
        $this->actingAsRole('AA');
        $this->postJson('/api/screenings', ['checked_criteria' => [1]])
            ->assertStatus(403);
    }

    public function test_kriteria_tidak_valid_ditolak_422(): void
    {
        $this->actingAsRole('PA');
        $this->postJson('/api/screenings', ['checked_criteria' => [999]])
            ->assertStatus(422);
    }
}
