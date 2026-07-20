<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 3 (Persiapan) khusus izin WAH — Work at Height.
 * Berbeda dari HWP/CWP (checklist Identifikasi Bahaya): PA hanya mengisi
 * JSA (nomor + file lampiran) dan, jika menggunakan perancah, Scaffolding
 * Certificate (nomor + file lampiran).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->string('jsa_file_path')->nullable()->after('nomor_jsa');
            $table->boolean('wah_menggunakan_perancah')->default(false)->after('jsa_file_path');
            $table->string('wah_scaffolding_cert_nomor', 50)->nullable()->after('wah_menggunakan_perancah');
            $table->string('wah_scaffolding_cert_file_path')->nullable()->after('wah_scaffolding_cert_nomor');
            $table->timestamp('wah_persiapan_diisi_at')->nullable()->after('wah_scaffolding_cert_file_path');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn([
                'jsa_file_path',
                'wah_menggunakan_perancah',
                'wah_scaffolding_cert_nomor',
                'wah_scaffolding_cert_file_path',
                'wah_persiapan_diisi_at',
            ]);
        });
    }
};
