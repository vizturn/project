<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 7 — Log masuk/keluar ruang terbatas (CSE).
 * Dicatat oleh Petugas Jaga: siapa masuk, jam masuk, jam keluar.
 * Sesuai flowchart Lampiran 10: PJ memberi tahu IA sebelum & sesudah
 * personel memasuki ruang terbatas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cse_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_id')->constrained('permits')->cascadeOnDelete();
            $table->string('nama_pekerja', 150);
            $table->date('tanggal');
            $table->time('jam_masuk');
            $table->time('jam_keluar')->nullable();
            $table->text('catatan')->nullable();
            $table->foreignId('dicatat_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('permit_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cse_access_logs');
    }
};
