<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Salinan resmi dari vendor/laravel/sanctum/database/migrations
     * (Sanctum TIDAK otomatis memuat migration-nya sendiri, harus
     * di-publish manual — lihat SanctumServiceProvider::boot()).
     * Tanpa tabel ini, penerbitan Bearer token via Auth Context (Sanctum)
     * di frontend tidak akan pernah bisa jalan.
     */
    public function up(): void
    {
        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->text('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
    }
};
