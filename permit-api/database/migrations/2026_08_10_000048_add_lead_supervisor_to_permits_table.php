<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nama Lead/Supervisor (Bagian 1 — Uraian Pekerjaan) — isian teks manual oleh
 * PA, ditampilkan di atas Deskripsi Pekerjaan pada form pengajuan izin.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->string('lead_supervisor', 150)->nullable()->after('referensi_peralatan');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn('lead_supervisor');
        });
    }
};
