<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermitTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['kode' => 'HWP', 'nama' => 'Izin Kerja Panas'],
            ['kode' => 'CWP', 'nama' => 'Izin Kerja Dingin'],
            ['kode' => 'CSE', 'nama' => 'Izin Masuk Ruang Terbatas'],
            ['kode' => 'WAH', 'nama' => 'Izin Kerja di Ketinggian'],
        ];

        foreach ($types as $t) {
            DB::table('permit_types')->updateOrInsert(
                ['kode' => $t['kode']],
                ['nama' => $t['nama'], 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }
}
