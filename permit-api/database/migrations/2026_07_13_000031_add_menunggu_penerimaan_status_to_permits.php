<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * STEP 27 — Status baru: 'menunggu_penerimaan'.
 * Setelah IA menerbitkan (Bagian 6), izin menunggu PA menerima PTW (Bagian 7)
 * sebelum benar-benar berstatus AKTIF.
 */
return new class extends Migration
{
    private const SEMUA_STATUS = "'draft','menunggu_approval','disetujui','ditolak','menunggu_penerbitan','menunggu_penerimaan','aktif','ditunda','kadaluarsa','selesai','closed'";

    private const STATUS_LAMA = "'draft','menunggu_approval','disetujui','ditolak','menunggu_penerbitan','aktif','ditunda','kadaluarsa','selesai','closed'";

    public function up(): void
    {
        DB::statement(
            "ALTER TABLE permits MODIFY COLUMN status ENUM(" . self::SEMUA_STATUS . ") NOT NULL DEFAULT 'draft'"
        );

        // permit_status_history menyimpan status sebagai string -> tidak perlu diubah.
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE permits MODIFY COLUMN status ENUM(" . self::STATUS_LAMA . ") NOT NULL DEFAULT 'draft'"
        );
    }
};
