<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * STEP 26 — Bagian 3 formulir: Nomor JSA, tingkat risiko, uraian bahaya lainnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->string('nomor_jsa', 50)->nullable()->after('durasi');
            $table->enum('tingkat_risiko', ['tinggi', 'sedang', 'rendah'])->nullable()->after('nomor_jsa');
            $table->text('bahaya_lainnya')->nullable()->after('tingkat_risiko');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn(['nomor_jsa', 'tingkat_risiko', 'bahaya_lainnya']);
        });
    }
};
