<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * WAH Bagian 3: "PA telah menetapkan pekerja yang diizinkan untuk
 * melakukan pekerjaan di ketinggian" — tabel nama pekerja + info
 * "Telah Mengikuti Pelatihan Bekerja di Ketinggian" (Ya/Tidak).
 * Kolom ini nullable karena hanya relevan untuk personel yang didaftarkan
 * lewat alur Persiapan WAH; personel jenis izin lain tidak mengisinya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permit_personnel', function (Blueprint $table) {
            $table->boolean('telah_pelatihan_ketinggian')->nullable()->after('peran_pekerjaan');
        });
    }

    public function down(): void
    {
        Schema::table('permit_personnel', function (Blueprint $table) {
            $table->dropColumn('telah_pelatihan_ketinggian');
        });
    }
};
