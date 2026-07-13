<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permits', function (Blueprint $table) {
            $table->id();
            $table->string('nomor_izin', 50)->unique();
            $table->foreignId('screening_id')->nullable()->constrained('screenings')->nullOnDelete();
            $table->foreignId('permit_type_id')->constrained('permit_types');
            $table->foreignId('wo_id')->nullable()->constrained('work_orders')->nullOnDelete();
            $table->foreignId('equipment_id')->nullable()->constrained('equipment')->nullOnDelete();
            $table->foreignId('performing_authority_id')->constrained('users');
            $table->foreignId('approval_authority_id')->nullable()->constrained('users');
            $table->foreignId('issuing_authority_id')->nullable()->constrained('users');
            $table->string('lokasi', 150);
            $table->text('deskripsi_pekerjaan');
            $table->string('durasi', 50)->nullable();
            $table->enum('status', [
                'draft', 'menunggu_approval', 'disetujui', 'ditolak',
                'menunggu_penerbitan', 'aktif', 'ditunda', 'kadaluarsa',
                'selesai', 'closed',
            ])->default('draft');
            $table->timestamp('tgl_terbit')->nullable();
            $table->timestamp('tgl_kadaluarsa')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permits');
    }
};
