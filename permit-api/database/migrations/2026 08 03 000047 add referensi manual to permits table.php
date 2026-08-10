<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Reference WO & Peralatan pada pengajuan izin (Bagian 1) awalnya dropdown
 * yang merujuk ke tabel master work_orders/equipment (wo_id, equipment_id).
 * Diubah jadi isian teks manual oleh PA — kolom FK lama TIDAK dihapus
 * (data lama & relasi workOrder()/equipment() tetap ada untuk kompatibilitas),
 * cukup ditambah 2 kolom teks baru yang menggantikan pemakaiannya di form.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->string('referensi_wo', 100)->nullable()->after('wo_id');
            $table->string('referensi_peralatan', 150)->nullable()->after('equipment_id');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn(['referensi_wo', 'referensi_peralatan']);
        });
    }
};
