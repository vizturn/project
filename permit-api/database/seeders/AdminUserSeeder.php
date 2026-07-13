<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Buat / perbarui user admin default (idempotent)
        DB::table('users')->updateOrInsert(
            ['email' => 'admin@permit.test'],
            [
                'name'         => 'Administrator',
                'password'     => Hash::make('password'),
                'jabatan'      => 'System Administrator',
                'status_aktif' => true,
                'updated_at'   => now(),
                'created_at'   => now(),
            ]
        );

        $adminId   = DB::table('users')->where('email', 'admin@permit.test')->value('id');
        $admRoleId = DB::table('roles')->where('kode_role', 'ADM')->value('id');

        // Pasangkan peran ADM ke user admin (idempotent)
        if ($adminId && $admRoleId) {
            DB::table('user_roles')->updateOrInsert(
                ['user_id' => $adminId, 'role_id' => $admRoleId],
                ['updated_at' => now(), 'created_at' => now()]
            );
        }
    }
}
