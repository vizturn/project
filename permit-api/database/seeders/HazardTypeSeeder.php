<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * STEP 26 — Master bahaya Bagian 3 formulir PTW.
 * Sumber: EMP-SHE-FOM-00.016 (Hot Work) & EMP-SHE-FOM-00.017 (Cold Work).
 *
 * Item 01-18 identik untuk kedua jenis; item 19-20 BERBEDA; item 21 sama.
 * Idempotent (updateOrInsert) -> aman dijalankan berulang.
 */
class HazardTypeSeeder extends Seeder
{
    /** Bahaya 01-18: sama untuk Hot Work & Cold Work. */
    private const UMUM = [
        1  => 'Confined Space/ruang terbatas',
        2  => 'Akses keluar/masuk yang sulit',
        3  => 'Cuaca buruk',
        4  => 'Hot surface/permukaan panas',
        5  => 'Bahan berbahaya (chemicals, explosives)',
        6  => 'Vibration/getaran',
        7  => 'SIMOPS',
        8  => 'Manual Handling',
        9  => 'Bekerja di luar pembatas',
        10 => 'Benda melenting (proyektil)',
        11 => 'Dropped object/benda terjatuh',
        12 => 'Gas beracun (H2S, CO2)',
        13 => 'Noise/kebisingan',
        14 => 'Perkakas (hand-tools, power tools)',
        15 => 'Tergelincir, terpeleset, tersandung',
        16 => 'Bukaan tanpa pelindung',
        17 => 'Tekanan tinggi',
        18 => 'Heat stress/pajanan panas',
    ];

    /** Bahaya khusus Hot Work (HWP). */
    private const KHUSUS_HWP = [
        19 => 'Flammables/bahan-bahan mudah terbakar',
        20 => 'Spark/percikan bunga api',
        21 => 'Benda bergerak',
    ];

    /** Bahaya khusus Cold Work (CWP). */
    private const KHUSUS_CWP = [
        19 => 'Rigging, Lifting',
        20 => 'Benda tajam/abrasif',
        21 => 'Benda bergerak',
    ];

    public function run(): void
    {
        $this->isiUntuk('HWP', self::UMUM + self::KHUSUS_HWP);
        $this->isiUntuk('CWP', self::UMUM + self::KHUSUS_CWP);
    }

    private function isiUntuk(string $kodeJenis, array $bahaya): void
    {
        $permitTypeId = DB::table('permit_types')->where('kode', $kodeJenis)->value('id');

        if (! $permitTypeId) {
            return; // jenis izin belum di-seed
        }

        foreach ($bahaya as $no => $deskripsi) {
            DB::table('hazard_types')->updateOrInsert(
                ['permit_type_id' => $permitTypeId, 'no_bahaya' => $no],
                ['deskripsi' => $deskripsi, 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }
}
