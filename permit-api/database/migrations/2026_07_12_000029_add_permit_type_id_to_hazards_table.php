<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * STEP 26 — Bahaya yang dicentang dicatat per jenis izin
 * (izin multi-jenis memiliki daftar bahaya berbeda per jenis).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hazards', function (Blueprint $table) {
            $table->foreignId('permit_type_id')
                ->nullable()
                ->after('permit_id')
                ->constrained('permit_types')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('hazards', function (Blueprint $table) {
            $table->dropForeign(['permit_type_id']);
            $table->dropColumn('permit_type_id');
        });
    }
};
