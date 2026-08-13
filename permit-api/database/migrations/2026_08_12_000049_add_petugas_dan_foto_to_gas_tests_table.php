<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambah 2 kolom pada gas_tests:
 *  - petugas_nama : nama petugas yang MELAKSANAKAN pengetesan, diisi manual
 *                   oleh pengguna (IA/AGT) yang menginput hasil. Ini berbeda
 *                   dari agt_id (akun sistem yang login & menginput data) —
 *                   di lapangan kadang bukan pemegang akun sendiri yang
 *                   memegang alat gas detector.
 *  - foto_path    : path file foto dokumentasi pengetesan (opsional),
 *                   disimpan di disk "public" seperti file lain (PSB, JSA,
 *                   dst) sehingga bisa diakses langsung lewat /storage/...
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gas_tests', function (Blueprint $table) {
            $table->string('petugas_nama', 150)->nullable()->after('agt_id');
            $table->string('foto_path')->nullable()->after('h2s_ppm');
        });
    }

    public function down(): void
    {
        Schema::table('gas_tests', function (Blueprint $table) {
            $table->dropColumn(['petugas_nama', 'foto_path']);
        });
    }
};
