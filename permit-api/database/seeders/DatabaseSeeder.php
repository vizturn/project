<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermitTypeSeeder::class,
            PsbTypeSeeder::class,
            ScreeningCriteriaSeeder::class,
            AdminUserSeeder::class, // wajib setelah RoleSeeder (butuh role ADM)
        ]);
    }
}
