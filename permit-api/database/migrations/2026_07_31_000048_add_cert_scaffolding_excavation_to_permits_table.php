<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sertifikat Scaffolding (Perancah) & Excavation (Penggalian) pada Bagian 4.
 * Pola sama dengan sertifikat isolasi: IA menandai diperlukan; bila ya,
 * nomor & file wajib. Kolom nomor (cert_scaffolding, cert_excavation) sudah ada.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->boolean('cert_scaffolding_diperlukan')->default(false)->after('cert_scaffolding');
            $table->string('cert_scaffolding_file_path')->nullable()->after('cert_scaffolding_diperlukan');
            $table->boolean('cert_excavation_diperlukan')->default(false)->after('cert_excavation');
            $table->string('cert_excavation_file_path')->nullable()->after('cert_excavation_diperlukan');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn([
                'cert_scaffolding_diperlukan', 'cert_scaffolding_file_path',
                'cert_excavation_diperlukan', 'cert_excavation_file_path',
            ]);
        });
    }
};
