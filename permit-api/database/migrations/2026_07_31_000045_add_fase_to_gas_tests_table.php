<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Menambah kolom `fase` pada gas_tests untuk membedakan pengujian kadar gas CSE:
 *   - "awal"     : pengujian sebelum penerbitan (syarat wajib terbit)
 *   - "lanjutan" : pengujian berulang selama pekerjaan berlangsung (izin aktif)
 *
 * Nullable karena HWP/CWP tidak memakai pembagian fase (uji gas biasa).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('gas_tests', function (Blueprint $table) {
            $table->string('fase', 10)->nullable()->after('agt_id');
        });
    }

    public function down(): void
    {
        Schema::table('gas_tests', function (Blueprint $table) {
            $table->dropColumn('fase');
        });
    }
};
