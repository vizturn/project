<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bagian 7 (Notifikasi Saat Memulai Bekerja di Ketinggian) — khusus WAH.
 * PA dapat mencatat berkali-kali kapan ia naik & turun selama izin AKTIF,
 * mirip pola riwayat pada Live Audit.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wah_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_id')->constrained()->cascadeOnDelete();
            $table->date('tanggal');
            $table->time('jam_naik')->nullable();
            $table->time('jam_turun')->nullable();
            $table->text('catatan')->nullable();
            $table->foreignId('dicatat_oleh')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wah_access_logs');
    }
};
