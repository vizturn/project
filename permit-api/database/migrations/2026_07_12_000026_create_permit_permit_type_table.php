<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * STEP 25 — Satu izin dapat mencakup BEBERAPA jenis izin
 * (mis. Hot Work + Work at Height dalam satu pekerjaan).
 *
 * Kolom permits.permit_type_id TETAP dipertahankan (diisi jenis pertama)
 * agar data & kode lama tidak rusak. Sumber kebenaran = tabel pivot ini.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permit_permit_type', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_id')->constrained('permits')->cascadeOnDelete();
            $table->foreignId('permit_type_id')->constrained('permit_types');
            $table->timestamps();

            $table->unique(['permit_id', 'permit_type_id']);
        });

        // Backfill: izin yang sudah ada dipindahkan ke pivot agar konsisten.
        $existing = DB::table('permits')
            ->whereNotNull('permit_type_id')
            ->get(['id', 'permit_type_id']);

        foreach ($existing as $permit) {
            DB::table('permit_permit_type')->insertOrIgnore([
                'permit_id'      => $permit->id,
                'permit_type_id' => $permit->permit_type_id,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('permit_permit_type');
    }
};
