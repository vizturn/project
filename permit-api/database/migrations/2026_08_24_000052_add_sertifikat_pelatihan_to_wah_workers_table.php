<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 3 (Persiapan, khusus WAH) — bukti sertifikat pelatihan bekerja di
 * ketinggian per pekerja. Diunggah PA/IA saat `sudah_pelatihan` dicentang Ya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wah_workers', function (Blueprint $table) {
            $table->string('sertifikat_pelatihan_file_path')->nullable()->after('sudah_pelatihan');
        });
    }

    public function down(): void
    {
        Schema::table('wah_workers', function (Blueprint $table) {
            $table->dropColumn('sertifikat_pelatihan_file_path');
        });
    }
};
