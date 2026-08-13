<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tabel penghitung nomor urut izin, satu baris per tahun.
 *
 * KENAPA PERLU TABEL SENDIRI, tidak cukup membaca nomor terakhir di `permits`?
 *
 * Cara lama membaca nomor tertinggi lalu menambah satu:
 *
 *     $last = Permit::where('nomor_izin','like',$prefix.'%')->orderByDesc('id')->value(...);
 *     $seq  = ((int) substr($last, ...)) + 1;
 *
 * Pola baca-lalu-tulis seperti itu punya lubang balapan (race condition): bila
 * dua PA menekan "Ajukan" pada saat hampir bersamaan, keduanya membaca nomor
 * terakhir yang SAMA, lalu keduanya menghitung urutan berikutnya yang sama pula.
 * Satu berhasil disimpan, satunya lagi ditolak MySQL karena kolom `nomor_izin`
 * ber-constraint unique — PA kedua melihat error 500 tanpa penjelasan dan
 * pengajuannya hilang.
 *
 * Dengan tabel penghitung, pengambilan nomor dikunci di tingkat baris
 * (`lockForUpdate`), sehingga PA kedua menunggu sebentar lalu mendapat nomor
 * berikutnya yang benar. Lihat PermitService::nomorBerurutan().
 *
 * Alternatif yang dipertimbangkan dan tidak dipakai:
 *  - AUTO_INCREMENT tabel terpisah → tetap perlu baris dummy tiap pengambilan.
 *  - Memakai kolom `permits.id` langsung → nomor melompat tiap kali draft
 *    dihapus, dan tidak bisa direset per tahun.
 *  - Gap lock lewat SELECT ... FOR UPDATE pada `permits` → berhasil di InnoDB
 *    tapi perilakunya bergantung isolation level; kurang eksplisit dibaca
 *    developer berikutnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permit_number_counters', function (Blueprint $table) {
            // Tahun sebagai primary key: deret nomor direset setiap pergantian
            // tahun, sesuai format 001/PTW/2026.
            $table->unsignedSmallInteger('tahun')->primary();

            // Nomor terakhir yang SUDAH dipakai pada tahun tersebut.
            // Nomor berikutnya = last_number + 1.
            $table->unsignedInteger('last_number')->default(0);

            $table->timestamps();
        });

        // Menanam nilai awal dari data yang sudah ada, supaya nomor baru tidak
        // bertabrakan dengan izin lama yang formatnya masih HWP/2026/0001.
        // Diambil dari JUMLAH izin tahun berjalan — bukan dari parsing nomor
        // lama, karena deret lama terpisah per jenis (HWP punya 0001, CWP juga
        // punya 0001) sehingga tidak ada satu angka tertinggi yang sahih.
        $tahun = (int) date('Y');
        $jumlah = DB::table('permits')->whereYear('created_at', $tahun)->count();

        DB::table('permit_number_counters')->insert([
            'tahun'       => $tahun,
            'last_number' => $jumlah,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('permit_number_counters');
    }
};
