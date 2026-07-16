<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * STEP 27 — Bagian 4 (Referensi Pendukung), Bagian 5 (Penetapan Uji Gas),
 * dan Bagian 7 (Penerimaan PTW oleh PA).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            // --- Bagian 4: Referensi Pendukung (diisi IA) ---
            $table->string('ref_permit_cse', 50)->nullable()->after('bahaya_lainnya');
            $table->string('ref_permit_wah', 50)->nullable()->after('ref_permit_cse');
            $table->string('cert_isolation', 50)->nullable()->after('ref_permit_wah');
            $table->string('cert_scaffolding', 50)->nullable()->after('cert_isolation');
            $table->string('cert_excavation', 50)->nullable()->after('cert_scaffolding');
            $table->text('sistem_safety_dinonaktifkan')->nullable()->after('cert_excavation');
            $table->text('referensi_lainnya')->nullable()->after('sistem_safety_dinonaktifkan');
            $table->timestamp('referensi_diisi_at')->nullable()->after('referensi_lainnya');

            // --- Bagian 5: Penetapan pengujian gas (oleh IA) ---
            $table->boolean('gas_uji_flammable')->default(false)->after('referensi_diisi_at');
            $table->boolean('gas_uji_oksigen')->default(false)->after('gas_uji_flammable');
            $table->boolean('gas_uji_beracun')->default(false)->after('gas_uji_oksigen');
            $table->string('gas_periode_ulang', 100)->nullable()->after('gas_uji_beracun');
            $table->timestamp('gas_ditetapkan_at')->nullable()->after('gas_periode_ulang');

            // --- Bagian 7: Penerimaan PTW (oleh PA) ---
            $table->timestamp('diterima_pa_at')->nullable()->after('gas_ditetapkan_at');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn([
                'ref_permit_cse', 'ref_permit_wah',
                'cert_isolation', 'cert_scaffolding', 'cert_excavation',
                'sistem_safety_dinonaktifkan', 'referensi_lainnya', 'referensi_diisi_at',
                'gas_uji_flammable', 'gas_uji_oksigen', 'gas_uji_beracun',
                'gas_periode_ulang', 'gas_ditetapkan_at',
                'diterima_pa_at',
            ]);
        });
    }
};
