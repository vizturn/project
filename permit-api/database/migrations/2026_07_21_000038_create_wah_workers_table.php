<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 3 (Persiapan, khusus WAH) — daftar pekerja yang diizinkan bekerja
 * di ketinggian. Jumlah bervariasi per izin, jadi disimpan di tabel terpisah
 * (satu izin -> banyak pekerja). Nama diisi manual oleh PA; centang pelatihan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wah_workers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_id')->constrained('permits')->cascadeOnDelete();
            $table->string('nama_pekerja', 150);
            $table->boolean('sudah_pelatihan')->default(false);
            $table->timestamps();

            $table->index('permit_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wah_workers');
    }
};
