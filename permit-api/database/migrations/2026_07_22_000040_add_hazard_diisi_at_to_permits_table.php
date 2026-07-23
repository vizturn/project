<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Penanda kelengkapan Bagian 3 (Identifikasi Bahaya) untuk HWP/CWP/CSE.
 * Diperlukan agar izin GABUNGAN (mis. CWP + WAH) tahu apakah bagian bahaya
 * sudah diisi — terpisah dari status, karena tiap jenis izin punya bagiannya
 * sendiri yang berjalan paralel. Status baru maju ke menunggu_penerbitan
 * setelah SEMUA bagian dari SEMUA jenis lengkap.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->timestamp('hazard_diisi_at')->nullable()->after('deskripsi_pekerjaan');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn('hazard_diisi_at');
        });
    }
};
