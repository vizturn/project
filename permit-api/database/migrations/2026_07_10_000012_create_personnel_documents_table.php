<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('personnel_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_personnel_id')->constrained('permit_personnel')->cascadeOnDelete();
            $table->enum('jenis', ['mcu', 'kompetensi']);
            $table->string('nomor', 50)->nullable();
            $table->date('masa_berlaku')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personnel_documents');
    }
};
