<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kolom tambahan untuk pendaftaran mandiri (register):
 *   - divisi        : unit/divisi pemohon
 *   - perusahaan    : asal perusahaan pemohon
 *   - role_diminta  : kode role yang diminta saat mendaftar (mis. "PA"),
 *                     dikonfirmasi/diubah SHE saat mengaktifkan akun
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('divisi', 100)->nullable()->after('jabatan');
            $table->string('perusahaan', 150)->nullable()->after('divisi');
            $table->string('role_diminta', 10)->nullable()->after('perusahaan');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['divisi', 'perusahaan', 'role_diminta']);
        });
    }
};
