<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PsbTypeSeeder extends Seeder
{
    public function run(): void
    {
        $psb = [
            ['kode' => 'PSB-1',  'nama' => 'Memasuki Ruang Terbatas'],
            ['kode' => 'PSB-2',  'nama' => 'Pembukaan Isolasi dan Pemasokan Energi Kembali'],
            ['kode' => 'PSB-3',  'nama' => 'Berkendara (Mengemudi)'],
            ['kode' => 'PSB-4',  'nama' => 'Isolasi Energi'],
            ['kode' => 'PSB-5',  'nama' => 'Penggalian'],
            ['kode' => 'PSB-6',  'nama' => 'Pekerjaan Panas'],
            ['kode' => 'PSB-7',  'nama' => 'Sistem Listrik Beraliran/Hidup'],
            ['kode' => 'PSB-8',  'nama' => 'Angkutan Orang'],
            ['kode' => 'PSB-9',  'nama' => 'Pengangkatan Mekanis'],
            ['kode' => 'PSB-10', 'nama' => 'Penanganan Turbular'],
            ['kode' => 'PSB-11', 'nama' => 'Bekerja di Sekitar Peralatan Bergerak'],
            ['kode' => 'PSB-12', 'nama' => 'Bekerja di Dekat Air'],
            ['kode' => 'PSB-13', 'nama' => 'Bekerja di Ketinggian'],
        ];

        foreach ($psb as $p) {
            DB::table('psb_types')->updateOrInsert(
                ['kode' => $p['kode']],
                ['nama' => $p['nama'], 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }
}
