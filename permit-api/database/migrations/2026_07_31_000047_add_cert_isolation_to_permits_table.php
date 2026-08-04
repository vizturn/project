<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Sertifikat Isolasi pada Bagian 4 (Referensi Pendukung, HWP/CWP).
 * IA menandai apakah sertifikat isolasi diperlukan; bila ya, nomor & file
 * (unggahan) menjadi wajib. Kolom nomor (cert_isolation) sudah ada sebelumnya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->boolean('cert_isolation_diperlukan')->default(false)->after('cert_isolation');
            $table->string('cert_isolation_file_path')->nullable()->after('cert_isolation_diperlukan');
        });
    }

    public function down(): void
    {
        Schema::table('permits', function (Blueprint $table) {
            $table->dropColumn(['cert_isolation_diperlukan', 'cert_isolation_file_path']);
        });
    }
};
