<?php

namespace Tests\Feature;

use Database\Seeders\IntegrationMockSeeder;

class ReportAndIntegrationTest extends ApiTestCase
{
    public function test_she_dapat_melihat_audit_log(): void
    {
        $this->buatIzinAktif(); // menghasilkan beberapa audit log

        $this->actingAsRole('SHE');
        $this->getJson('/api/audit-logs')
            ->assertOk()
            ->assertJsonStructure(['data']);
    }

    public function test_pa_dilarang_melihat_audit_log(): void
    {
        $this->actingAsRole('PA');
        $this->getJson('/api/audit-logs')->assertStatus(403);
    }

    public function test_rekap_mengembalikan_total_status_dan_jenis(): void
    {
        $this->buatIzinAktif();

        $this->actingAsRole('SHE');
        $this->getJson('/api/reports/summary')
            ->assertOk()
            ->assertJsonStructure(['data' => ['total', 'by_status', 'by_type']])
            ->assertJsonPath('data.total', 1);
    }

    public function test_data_mock_work_order_dan_equipment_tersedia(): void
    {
        $this->seed(IntegrationMockSeeder::class);

        $this->actingAsRole('PA');

        $this->getJson('/api/work-orders')
            ->assertOk()
            ->assertJsonCount(4, 'data');

        $this->getJson('/api/equipment')
            ->assertOk()
            ->assertJsonCount(4, 'data');
    }

    public function test_pa_dapat_membuat_izin_dengan_referensi_wo_dan_peralatan(): void
    {
        $this->seed(IntegrationMockSeeder::class);

        $woId = \Illuminate\Support\Facades\DB::table('work_orders')->value('id');
        $eqId = \Illuminate\Support\Facades\DB::table('equipment')->value('id');

        $aa = $this->userWithRole('AA');
        $ia = $this->userWithRole('IA');

        $this->actingAsRole('PA');
        $this->postJson('/api/permits', [
            'permit_type_ids'       => [$this->idPermitType('CWP')],
            'lokasi'                => 'Area B',
            'deskripsi_pekerjaan'   => 'Inspeksi pipa',
            'wo_id'                 => $woId,
            'equipment_id'          => $eqId,
            'approval_authority_id' => $aa->id,
            'issuing_authority_id'  => $ia->id,
        ])->assertCreated();

        $this->assertDatabaseHas('permits', ['wo_id' => $woId, 'equipment_id' => $eqId]);
    }
}
