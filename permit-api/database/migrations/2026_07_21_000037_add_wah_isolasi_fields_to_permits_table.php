<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 3 (Persiapan) khusus WAH — bagian IA:
 * "IA telah mengevaluasi sistem yang berkaitan dengan Lokasi kerja di
 * ketinggian, apakah memerlukan ISOLASI ENERGI" (Diperlukan/Tidak) +
 * Sertifikat Isolasi (nomor + lampiran file) jika Diperlukan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->boolean('wah_isolasi_diperlukan')->nullable()->after('wah_persiapan_diisi_at');
            $table->string('wah_isolasi_cert_nomor', 50)->nullable()->after('wah_isolasi_diperlukan');
            $table->string('wah_isolasi_cert_file_path')->nullable()->after('wah_isolasi_cert_nomor');
            $table->timestamp('wah_isolasi_diisi_at')->nullable()->after('wah_isolasi_cert_file_path');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn([
                'wah_isolasi_diperlukan',
                'wah_isolasi_cert_nomor',
                'wah_isolasi_cert_file_path',
                'wah_isolasi_diisi_at',
            ]);
        });
    }
};
