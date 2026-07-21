<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 3 (Persiapan) khusus WAH — pelengkap bagian PA yang sebelumnya
 * hanya mencakup JSA & Scaffolding Certificate. Field baru ini menutup
 * sisa formulir kertas "Work at Height Permit":
 *  - Nama Petugas (pengawas keselamatan bekerja di ketinggian) & peralatan
 *    komunikasi yang digunakan.
 *  - Checklist "Peralatan khusus yang diperlukan" (Full body harness,
 *    Double lanyard, Anchor Point yang disetujui, Barrier di sekitar
 *    Lokasi kerja, Medic/first aid kit, Ambulance, Lainnya).
 * Daftar pekerja yang diizinkan bekerja di ketinggian (nama + status
 * pelatihan) disimpan di tabel permit_personnel (lihat migration terkait).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->string('wah_nama_petugas_pengawas', 100)->nullable()->after('wah_persiapan_diisi_at');
            $table->string('wah_peralatan_komunikasi', 100)->nullable()->after('wah_nama_petugas_pengawas');

            $table->boolean('wah_alat_full_body_harness')->default(false)->after('wah_peralatan_komunikasi');
            $table->boolean('wah_alat_double_lanyard')->default(false)->after('wah_alat_full_body_harness');
            $table->boolean('wah_alat_anchor_point')->default(false)->after('wah_alat_double_lanyard');
            $table->boolean('wah_alat_barrier')->default(false)->after('wah_alat_anchor_point');
            $table->boolean('wah_alat_medic_kit')->default(false)->after('wah_alat_barrier');
            $table->boolean('wah_alat_ambulance')->default(false)->after('wah_alat_medic_kit');
            $table->string('wah_alat_lainnya', 100)->nullable()->after('wah_alat_ambulance');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn([
                'wah_nama_petugas_pengawas',
                'wah_peralatan_komunikasi',
                'wah_alat_full_body_harness',
                'wah_alat_double_lanyard',
                'wah_alat_anchor_point',
                'wah_alat_barrier',
                'wah_alat_medic_kit',
                'wah_alat_ambulance',
                'wah_alat_lainnya',
            ]);
        });
    }
};
