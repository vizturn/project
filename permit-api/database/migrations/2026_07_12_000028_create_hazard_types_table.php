<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * STEP 26 — Master daftar bahaya (Bagian 3 formulir PTW).
 * Daftar bahaya BERBEDA per jenis izin: item 01-18 sama untuk HWP & CWP,
 * tetapi item 19-20 berbeda (HWP: flammables/spark; CWP: rigging/benda tajam).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hazard_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_type_id')->constrained('permit_types')->cascadeOnDelete();
            $table->unsignedTinyInteger('no_bahaya');
            $table->string('deskripsi', 255);
            $table->timestamps();

            $table->unique(['permit_type_id', 'no_bahaya']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hazard_types');
    }
};
