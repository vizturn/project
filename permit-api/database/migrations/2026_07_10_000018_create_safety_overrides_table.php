<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('safety_overrides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('permit_id')->constrained('permits')->cascadeOnDelete();
            $table->string('sistem_keselamatan', 100);
            $table->timestamp('override_at');
            $table->foreignId('override_by')->constrained('users');
            $table->timestamp('reinstate_at')->nullable();
            $table->foreignId('reinstate_by')->nullable()->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('safety_overrides');
    }
};
