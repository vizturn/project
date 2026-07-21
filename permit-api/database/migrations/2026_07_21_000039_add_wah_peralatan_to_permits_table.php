<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 3 (Persiapan, khusus WAH) — peralatan khusus.
 * Checklist tetap disimpan sebagai JSON (array kode alat yang dicentang),
 * plus satu kolom teks untuk alat "lainnya" yang diketik manual.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->json('wah_peralatan')->nullable()->after('wah_persiapan_diisi_at');
            $table->string('wah_peralatan_lainnya', 255)->nullable()->after('wah_peralatan');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn(['wah_peralatan', 'wah_peralatan_lainnya']);
        });
    }
};
