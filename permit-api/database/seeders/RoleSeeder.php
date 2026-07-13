<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['kode_role' => 'PA',  'nama_role' => 'Performing Authority'],
            ['kode_role' => 'AA',  'nama_role' => 'Approval Authority'],
            ['kode_role' => 'IA',  'nama_role' => 'Issuing Authority'],
            ['kode_role' => 'AGT', 'nama_role' => 'Authorized Gas Tester'],
            ['kode_role' => 'PJ',  'nama_role' => 'Petugas Jaga'],
            ['kode_role' => 'PW',  'nama_role' => 'Petugas Pengawas Ketinggian'],
            ['kode_role' => 'SPV', 'nama_role' => 'Supervisor'],
            ['kode_role' => 'SHE', 'nama_role' => 'Departemen SHE'],
            ['kode_role' => 'ADM', 'nama_role' => 'Administrator'],
        ];

        foreach ($roles as $r) {
            DB::table('roles')->updateOrInsert(
                ['kode_role' => $r['kode_role']],
                ['nama_role' => $r['nama_role'], 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }
}
