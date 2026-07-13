<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Akun uji per peran untuk pengembangan/pengujian fitur.
 * Semua password: "password". Idempotent (aman dijalankan berulang).
 * Jalankan: php artisan db:seed --class=TestUsersSeeder
 */
class TestUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['email' => 'pa@permit.test',  'name' => 'PA Test',  'role' => 'PA',  'jabatan' => 'Performing Authority'],
            ['email' => 'pa1@permit.test',  'name' => 'PA1 Test',  'role' => 'PA',  'jabatan' => 'Performing Authority'],
            ['email' => 'aa@permit.test',  'name' => 'AA Test',  'role' => 'AA',  'jabatan' => 'Approval Authority'],
            ['email' => 'aa1@permit.test',  'name' => 'AA1 Test',  'role' => 'AA',  'jabatan' => 'Approval Authority'],
            ['email' => 'ia@permit.test',  'name' => 'IA Test',  'role' => 'IA',  'jabatan' => 'Issuing Authority'],
            ['email' => 'ia2@permit.test',  'name' => 'IA2 Test',  'role' => 'IA',  'jabatan' => 'Issuing Authority'],
            ['email' => 'agt@permit.test', 'name' => 'AGT Test', 'role' => 'AGT', 'jabatan' => 'Authorized Gas Tester'],
            ['email' => 'pj@permit.test',  'name' => 'PJ Test',  'role' => 'PJ',  'jabatan' => 'Petugas Jaga'],
            ['email' => 'pw@permit.test',  'name' => 'PW Test',  'role' => 'PW',  'jabatan' => 'Pengawas Ketinggian'],
            ['email' => 'spv@permit.test', 'name' => 'SPV Test', 'role' => 'SPV', 'jabatan' => 'Supervisor'],
            ['email' => 'she@permit.test', 'name' => 'SHE Test', 'role' => 'SHE', 'jabatan' => 'Departemen SHE'],
        ];

        foreach ($users as $u) {
            DB::table('users')->updateOrInsert(
                ['email' => $u['email']],
                [
                    'name'         => $u['name'],
                    'password'     => Hash::make('password'),
                    'jabatan'      => $u['jabatan'],
                    'status_aktif' => true,
                    'updated_at'   => now(),
                    'created_at'   => now(),
                ]
            );

            $uid = DB::table('users')->where('email', $u['email'])->value('id');
            $rid = DB::table('roles')->where('kode_role', $u['role'])->value('id');

            if ($uid && $rid) {
                DB::table('user_roles')->updateOrInsert(
                    ['user_id' => $uid, 'role_id' => $rid],
                    ['updated_at' => now(), 'created_at' => now()]
                );
            }
        }
    }
}
