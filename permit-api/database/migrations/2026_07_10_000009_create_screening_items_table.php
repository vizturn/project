<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('screening_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('screening_id')->constrained('screenings')->cascadeOnDelete();
            $table->integer('no_kriteria');
            $table->string('deskripsi', 255);
            $table->boolean('dicentang')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('screening_items');
    }
};
