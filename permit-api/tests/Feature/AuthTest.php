<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class AuthTest extends ApiTestCase
{
    public function test_login_berhasil_mengembalikan_token_dan_role(): void
    {
        $user = User::factory()->create([
            'email'        => 'pa@test.com',
            'password'     => 'rahasia123',
            'status_aktif' => true,
        ]);
        DB::table('user_roles')->insert([
            'user_id'    => $user->id,
            'role_id'    => DB::table('roles')->where('kode_role', 'PA')->value('id'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->postJson('/api/login', ['email' => 'pa@test.com', 'password' => 'rahasia123'])
            ->assertOk()
            ->assertJsonStructure(['token', 'token_type', 'user' => ['id', 'name', 'email', 'roles']])
            ->assertJsonPath('user.roles', ['PA']);
    }

    public function test_login_password_salah_ditolak_422(): void
    {
        User::factory()->create(['email' => 'a@test.com', 'password' => 'benar', 'status_aktif' => true]);

        $this->postJson('/api/login', ['email' => 'a@test.com', 'password' => 'salah'])
            ->assertStatus(422);
    }

    public function test_login_akun_nonaktif_ditolak_403(): void
    {
        User::factory()->create(['email' => 'b@test.com', 'password' => 'rahasia', 'status_aktif' => false]);

        $this->postJson('/api/login', ['email' => 'b@test.com', 'password' => 'rahasia'])
            ->assertStatus(403);
    }

    public function test_me_tanpa_login_401(): void
    {
        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_me_mengembalikan_profil(): void
    {
        $user = $this->actingAsRole('PA');
        $this->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->id);
    }
}
