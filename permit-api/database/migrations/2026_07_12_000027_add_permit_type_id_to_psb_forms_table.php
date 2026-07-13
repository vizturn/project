<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * STEP 25 — PSB kini dikelompokkan per jenis izin.
 * Nullable agar data lama (PSB tanpa jenis) tetap valid.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('psb_forms', function (Blueprint $table) {
            $table->foreignId('permit_type_id')
                ->nullable()
                ->after('permit_id')
                ->constrained('permit_types')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('psb_forms', function (Blueprint $table) {
            $table->dropForeign(['permit_type_id']);
            $table->dropColumn('permit_type_id');
        });
    }
};
