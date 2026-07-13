<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gas_tests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_id')->constrained('permits')->cascadeOnDelete();
            $table->foreignId('agt_id')->constrained('users');
            $table->date('tanggal');
            $table->time('jam');
            $table->decimal('lel_persen', 5, 2)->nullable();
            $table->decimal('oksigen_persen', 5, 2)->nullable();
            $table->decimal('co_ppm', 6, 2)->nullable();
            $table->decimal('h2s_ppm', 6, 2)->nullable();
            $table->boolean('hasil_aman')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gas_tests');
    }
};
