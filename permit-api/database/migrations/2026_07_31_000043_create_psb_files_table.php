<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel penyimpanan file PSB (Prosedur Sistem Berlisensi / Life Saving Rules).
 *
 * File PSB adalah dokumen pendukung per izin (tafsir "satu kantong per izin",
 * tidak terikat ke jenis PSB tertentu). Bisa diunggah oleh:
 *   - PA saat mengisi uraian pekerjaan / mengajukan izin
 *   - AA saat menyetujui (menambah dokumen bila perlu)
 * Kolom `peran_pengupload` menyimpan "PA" atau "AA" agar sumber file bisa
 * ditampilkan dan dibedakan di halaman detail izin.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('psb_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_id')->constrained('permits')->cascadeOnDelete();
            $table->foreignId('diupload_oleh')->nullable()->constrained('users')->nullOnDelete();
            $table->string('peran_pengupload', 5); // "PA" atau "AA"
            $table->string('file_path');
            $table->string('nama_asli');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('psb_files');
    }
};
