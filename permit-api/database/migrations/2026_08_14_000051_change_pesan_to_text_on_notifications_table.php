<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Perbesar kolom `pesan` pada tabel notifications dari VARCHAR(255) menjadi TEXT.
 *
 * Alasan: notifikasi keselamatan kerja per peran (sesuai SOP EMP-SHE-PCR-00.001-02
 * hal. 14-18) berisi teks tanggung jawab yang panjang (> 255 karakter), sehingga
 * tidak muat di VARCHAR(255) dan menyebabkan error "Data too long for column 'pesan'".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->text('pesan')->change();
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('pesan', 255)->change();
        });
    }
};
