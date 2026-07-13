<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\HazardTypeSeeder;
use Database\Seeders\PermitTypeSeeder;
use Database\Seeders\PsbTypeSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\ScreeningCriteriaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

abstract class ApiTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Master data yang dibutuhkan seluruh fitur.
        $this->seed([
            RoleSeeder::class,
            PermitTypeSeeder::class,
            PsbTypeSeeder::class,
            ScreeningCriteriaSeeder::class,
            HazardTypeSeeder::class,
        ]);
    }

    /** Buat user + lampirkan satu/lebih role (pakai kode_role). */
    protected function userWithRole(string ...$kodeRole): User
    {
        $user = User::factory()->create(['status_aktif' => true]);

        foreach ($kodeRole as $kode) {
            $roleId = DB::table('roles')->where('kode_role', $kode)->value('id');
            DB::table('user_roles')->insert([
                'user_id'    => $user->id,
                'role_id'    => $roleId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return $user->fresh();
    }

    /** Buat user ber-role lalu jadikan user aktif untuk request (Sanctum). */
    protected function actingAsRole(string ...$kodeRole): User
    {
        $user = $this->userWithRole(...$kodeRole);
        Sanctum::actingAs($user);

        return $user;
    }

    protected function idPermitType(string $kode): int
    {
        return (int) DB::table('permit_types')->where('kode', $kode)->value('id');
    }

    protected function idPsbType(string $kode): int
    {
        return (int) DB::table('psb_types')->where('kode', $kode)->value('id');
    }

    /**
     * Helper: buat izin (draft) dengan penugasan AA & IA.
     * Mengembalikan [id, pa, aa, ia].
     */
    protected function buatIzinDraft(): array
    {
        $aa = $this->userWithRole('AA');
        $ia = $this->userWithRole('IA');

        $pa = $this->actingAsRole('PA');
        $id = $this->postJson('/api/permits', [
            'permit_type_ids'       => [$this->idPermitType('HWP')],
            'lokasi'                => 'Area Stasiun A',
            'deskripsi_pekerjaan'   => 'Pengelasan pipa',
            'approval_authority_id' => $aa->id,
            'issuing_authority_id'  => $ia->id,
        ])->json('data.id');

        return ['id' => $id, 'pa' => $pa, 'aa' => $aa, 'ia' => $ia];
    }

    /** Helper: buat izin sampai status 'disetujui'. Mengembalikan [id, pa, aa, ia]. */
    protected function buatIzinDisetujui(): array
    {
        ['id' => $id, 'pa' => $pa, 'aa' => $aa, 'ia' => $ia] = $this->buatIzinDraft();

        Sanctum::actingAs($pa);
        $this->postJson("/api/permits/{$id}/submit");

        // Hanya AA yang DITUGASKAN yang boleh menyetujui.
        Sanctum::actingAs($aa);
        $this->postJson("/api/permits/{$id}/approve", [
            'psb' => [[
                'permit_type_id' => $this->idPermitType('HWP'),
                'psb_type_ids'   => [$this->idPsbType('PSB-6')],
            ]],
        ]);

        return ['id' => $id, 'pa' => $pa, 'aa' => $aa, 'ia' => $ia];
    }

    /**
     * Helper: PA melengkapi Bagian 3 (disetujui -> menunggu_penerbitan).
     * @param  int[]  $permitTypeIds  jenis izin yang tercakup
     */
    protected function lengkapiBahaya(int $permitId, array $permitTypeIds, array $noBahaya = [1, 4]): void
    {
        $this->postJson("/api/permits/{$permitId}/hazards", [
            'hazards' => array_map(fn ($tid) => [
                'permit_type_id' => $tid,
                'no_bahaya'      => $noBahaya,
            ], $permitTypeIds),
            'nomor_jsa'      => 'JSA-001',
            'tingkat_risiko' => 'sedang',
        ]);
    }

    /** Helper: buat izin sampai status 'aktif'. Mengembalikan [id, pa, aa, ia]. */
    protected function buatIzinAktif(): array
    {
        ['id' => $id, 'pa' => $pa, 'aa' => $aa, 'ia' => $ia] = $this->buatIzinDisetujui();

        $this->actingAsRole('AGT');
        $this->postJson("/api/permits/{$id}/gas-tests", [
            'oksigen_persen' => 20.9,
            'lel_persen'     => 1.0,
        ]);

        // STEP 26 — PA wajib melengkapi Bagian 3 sebelum izin dapat diterbitkan.
        Sanctum::actingAs($pa);
        $this->lengkapiBahaya($id, [$this->idPermitType('HWP')]);

        // Hanya IA yang DITUGASKAN yang boleh menerbitkan.
        Sanctum::actingAs($ia);
        $this->postJson("/api/permits/{$id}/issue");

        return ['id' => $id, 'pa' => $pa, 'aa' => $aa, 'ia' => $ia];
    }
}
