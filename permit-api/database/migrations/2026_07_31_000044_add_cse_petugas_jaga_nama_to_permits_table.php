<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Petugas Jaga CSE diubah dari referensi akun (cse_petugas_jaga_id) menjadi
 * input nama bebas (cse_petugas_jaga_nama). Petugas jaga tidak selalu punya
 * akun sistem, sehingga cukup dicatat namanya secara manual oleh PA.
 *
 * Kolom lama cse_petugas_jaga_id DIBIARKAN (nullable) untuk kompatibilitas
 * data lama; aplikasi berhenti memakainya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->string('cse_petugas_jaga_nama', 150)->nullable()->after('cse_petugas_jaga_id');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn('cse_petugas_jaga_nama');
        });
    }
};
