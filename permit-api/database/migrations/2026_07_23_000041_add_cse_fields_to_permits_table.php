<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 3 — Persiapan (khusus CSE / Confined Space Entry, FOM-00.018).
 *
 * Struktur mengikuti formulir kertas:
 *  - Isolasi Energi (ditentukan IA) — kolom terpisah dari WAH karena tiap
 *    jenis izin punya keputusan isolasinya sendiri pada izin gabungan.
 *  - Petugas Jaga: user terdaftar (role PJ) yang mencatat keluar-masuk
 *    ruang terbatas, beserta peralatan komunikasi yang digunakan.
 *  - Peralatan khusus CSE: escape harness+tripod, breathing apparatus,
 *    stretcher/ambulance, APAR, medic/first aid kit, ventilasi mekanis.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            // Bagian 3a — Isolasi Energi (IA)
            $table->boolean('cse_isolasi_diperlukan')->nullable()->after('wah_isolasi_diisi_at');
            $table->string('cse_isolasi_cert_nomor', 50)->nullable()->after('cse_isolasi_diperlukan');
            $table->string('cse_isolasi_cert_file_path')->nullable()->after('cse_isolasi_cert_nomor');
            $table->timestamp('cse_isolasi_diisi_at')->nullable()->after('cse_isolasi_cert_file_path');

            // Bagian 3b — Persiapan (PA)
            $table->foreignId('cse_petugas_jaga_id')->nullable()->after('cse_isolasi_diisi_at')
                  ->constrained('users')->nullOnDelete();
            $table->string('cse_alat_komunikasi', 100)->nullable()->after('cse_petugas_jaga_id');
            $table->json('cse_peralatan')->nullable()->after('cse_alat_komunikasi');
            $table->string('cse_peralatan_lainnya', 255)->nullable()->after('cse_peralatan');
            $table->timestamp('cse_persiapan_diisi_at')->nullable()->after('cse_peralatan_lainnya');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cse_petugas_jaga_id');
            $table->dropColumn([
                'cse_isolasi_diperlukan',
                'cse_isolasi_cert_nomor',
                'cse_isolasi_cert_file_path',
                'cse_isolasi_diisi_at',
                'cse_alat_komunikasi',
                'cse_peralatan',
                'cse_peralatan_lainnya',
                'cse_persiapan_diisi_at',
            ]);
        });
    }
};
