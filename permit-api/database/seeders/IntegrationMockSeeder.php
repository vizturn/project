<?php

namespace Database\Seeders;

use App\Services\MockIntegrationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Mengisi tabel referensi work_orders & equipment dengan data mock
 * (mensimulasikan sinkronisasi dari sistem eksternal).
 * Jalankan: php artisan db:seed --class=IntegrationMockSeeder
 */
class IntegrationMockSeeder extends Seeder
{
    public function run(): void
    {
        $mock = new MockIntegrationService();

        foreach ($mock->workOrders() as $wo) {
            DB::table('work_orders')->updateOrInsert(
                ['wo_number' => $wo['wo_number']],
                ['deskripsi' => $wo['deskripsi'], 'updated_at' => now(), 'created_at' => now()]
            );
        }

        foreach ($mock->equipment() as $eq) {
            DB::table('equipment')->updateOrInsert(
                ['nama_alat' => $eq['nama_alat']],
                [
                    'status_kalibrasi' => $eq['status_kalibrasi'],
                    'tgl_kalibrasi'    => $eq['tgl_kalibrasi'],
                    'updated_at'       => now(),
                    'created_at'       => now(),
                ]
            );
        }
    }
}
