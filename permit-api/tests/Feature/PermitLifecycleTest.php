<?php

namespace Tests\Feature;

use Laravel\Sanctum\Sanctum;

class PermitLifecycleTest extends ApiTestCase
{
    public function test_lifecycle_penuh_draft_sampai_closed(): void
    {
        // --- PA: buat (menunjuk AA & IA) + ajukan ---
        $aa = $this->userWithRole('AA');
        $ia = $this->userWithRole('IA');

        $pa = $this->actingAsRole('PA');
        $id = $this->postJson('/api/permits', [
            'permit_type_ids'       => [$this->idPermitType('HWP')],
            'lokasi'                => 'Area A',
            'deskripsi_pekerjaan'   => 'Pengelasan',
            'approval_authority_id' => $aa->id,
            'issuing_authority_id'  => $ia->id,
        ])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('permits', [
            'id'                    => $id,
            'status'                => 'draft',
            'approval_authority_id' => $aa->id,
            'issuing_authority_id'  => $ia->id,
        ]);

        $this->postJson("/api/permits/{$id}/submit")->assertOk();
        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_approval']);

        // AA yang ditunjuk menerima notifikasi
        $this->assertDatabaseHas('notifications', ['user_id' => $aa->id, 'permit_id' => $id]);

        // --- AA (yang ditunjuk): setujui + PSB ---
        Sanctum::actingAs($aa);
        $this->postJson("/api/permits/{$id}/approve", [
            'psb' => [[
                'permit_type_id' => $this->idPermitType('HWP'),
                'psb_type_ids'   => [$this->idPsbType('PSB-6')],
            ]],
        ])->assertOk();
        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'disetujui']);
        $this->assertDatabaseCount('psb_forms', 1);

        // IA yang ditunjuk otomatis diberi tahu
        $this->assertDatabaseHas('notifications', ['user_id' => $ia->id, 'permit_id' => $id]);

        // --- AGT: uji gas aman ---
        $this->actingAsRole('AGT');
        $this->postJson("/api/permits/{$id}/gas-tests", [
            'oksigen_persen' => 20.9, 'lel_persen' => 1,
        ])->assertCreated()->assertJsonPath('data.hasil_aman', true);

        // --- PA: lengkapi Bagian 3 (disetujui -> menunggu_penerbitan) ---
        Sanctum::actingAs($pa);
        $this->lengkapiBahaya($id, [$this->idPermitType('HWP')]);
        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'menunggu_penerbitan']);

        // --- IA (yang ditunjuk): terbitkan ---
        Sanctum::actingAs($ia);
        $this->postJson("/api/permits/{$id}/issue")->assertOk();
        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'aktif']);

        // --- PA (owner): kembalikan ---
        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/return")->assertOk();
        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'ditunda']);

        // --- IA: revalidasi ---
        Sanctum::actingAs($ia);
        $this->postJson("/api/permits/{$id}/revalidate")->assertOk();
        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'aktif']);

        // --- PA (owner): selesaikan ---
        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/complete")->assertOk();
        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'selesai']);

        // --- IA: tutup ---
        Sanctum::actingAs($ia);
        $this->postJson("/api/permits/{$id}/close")->assertOk();
        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'closed']);

        $this->assertDatabaseHas('permit_status_history', ['permit_id' => $id, 'status' => 'closed']);
    }
}
