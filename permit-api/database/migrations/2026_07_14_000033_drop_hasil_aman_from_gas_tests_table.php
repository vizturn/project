<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * STEP 28 — Uji gas menjadi PENCATATAN MURNI.
 *
 * Sistem tidak lagi menilai AMAN/TIDAK AMAN dan tidak memblokir penerbitan.
 * Penilaian kondisi aman sepenuhnya menjadi wewenang Issuing Authority (IA),
 * sebagaimana pernyataan pada Bagian 6 formulir PTW.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gas_tests', function (Blueprint $table) {
            $table->dropColumn('hasil_aman');
        });
    }

    public function down(): void
    {
        Schema::table('gas_tests', function (Blueprint $table) {
            $table->boolean('hasil_aman')->default(false);
        });
    }
};
