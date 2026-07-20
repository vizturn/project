<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Status baru khusus alur WAH: 'menunggu_persiapan_pa'.
 * Bagian 3 WAH sekarang 2 tahap:
 *  1) IA menentukan kebutuhan Isolasi Energi (status tetap 'disetujui' saat ini)
 *     -> setelah IA confirm, status jadi 'menunggu_persiapan_pa'.
 *  2) PA melengkapi JSA + (opsional) Scaffolding Certificate saat status
 *     'menunggu_persiapan_pa' -> setelah PA confirm, status jadi
 *     'menunggu_penerbitan' seperti biasa.
 */
return new class extends Migration
{
    private const SEMUA_STATUS = "'draft','menunggu_approval','disetujui','ditolak','menunggu_persiapan_pa','menunggu_penerbitan','menunggu_penerimaan','aktif','ditunda','kadaluarsa','selesai','closed'";

    private const STATUS_LAMA = "'draft','menunggu_approval','disetujui','ditolak','menunggu_penerbitan','menunggu_penerimaan','aktif','ditunda','kadaluarsa','selesai','closed'";

    public function up(): void
    {
        DB::statement(
            "ALTER TABLE permits MODIFY COLUMN status ENUM(" . self::SEMUA_STATUS . ") NOT NULL DEFAULT 'draft'"
        );
    }

    public function down(): void
    {
        DB::statement(
            "ALTER TABLE permits MODIFY COLUMN status ENUM(" . self::STATUS_LAMA . ") NOT NULL DEFAULT 'draft'"
        );
    }
};
