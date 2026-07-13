<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('sso_ref', 50)->nullable()->unique()->after('id');
            $table->string('jabatan', 100)->nullable()->after('email');
            $table->boolean('status_aktif')->default(true)->after('jabatan');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['sso_ref', 'jabatan', 'status_aktif']);
        });
    }
};
