<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bukti persetujuan langsung dari Lead/Supervisor (mis. tangkapan layar
 * percakapan WhatsApp) yang diinput PA saat mengisi nama Lead/Supervisor.
 *  - bukti_persetujuan_nama      : label/keterangan bukti, diisi manual PA.
 *  - bukti_persetujuan_file_path : path foto, disimpan di disk "public"
 *                                  seperti file lain (PSB, JSA, uji gas, dst).
 * Dapat dilihat oleh AA (dan pihak lain yang membuka detail izin) sebagai
 * pendukung saat menilai persetujuan (S12).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->string('bukti_persetujuan_nama', 150)->nullable()->after('lead_supervisor');
            $table->string('bukti_persetujuan_file_path')->nullable()->after('bukti_persetujuan_nama');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn(['bukti_persetujuan_nama', 'bukti_persetujuan_file_path']);
        });
    }
};
