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
            HazardTypeSeeder::class,
            AdminUserSeeder::class,
        ]);

        if (app()->environment('local', 'testing')) {
            $this->call([
                TestUsersSeeder::class,
            ]);
        }
    }
}
