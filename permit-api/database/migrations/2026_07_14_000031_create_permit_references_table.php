<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bagian 4 — Referensi Pendukung (khusus PTW Panas/HWP & PTW Dingin/CWP).
     * Diisi oleh Issuing Authority (IA) sebelum penerbitan (Bagian 6).
     */
    public function up(): void
    {
        Schema::create('permit_references', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_id')->unique()->constrained('permits')->cascadeOnDelete();

            // Permit lainnya (tulis nomor)
            $table->string('ref_confined_space_entry', 50)->nullable();
            $table->string('ref_bekerja_di_ketinggian', 50)->nullable();
            $table->string('ref_isolation', 50)->nullable();

            // Certificates (tulis nomor)
            $table->string('sertifikat_scaffolding', 50)->nullable();
            $table->string('sertifikat_excavation', 50)->nullable();

            $table->text('sistem_safety_dinonaktifkan')->nullable();
            $table->text('referensi_lainnya')->nullable(); // MSDS, Lifting Plan, Prosedur, dll

            $table->foreignId('filled_by')->nullable()->constrained('users');
            $table->timestamp('filled_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permit_references');
    }
};
