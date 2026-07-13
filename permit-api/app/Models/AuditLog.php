<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $table = 'audit_logs';

    protected $fillable = [
        'user_id',
        'aksi',
        'entitas',
        'entitas_id',
        'data_lama',
        'data_baru',
        'logged_at',
    ];

    protected function casts(): array
    {
        return [
            'data_lama' => 'array',
            'data_baru' => 'array',
            'logged_at' => 'datetime',
        ];
    }

    /**
     * User yang melakukan aksi. Nullable untuk aksi sistem (mis. scheduler).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relasi polymorphic "virtual" ke entitas yang diaudit (kolom entitas
     * menyimpan nama tabel, entitas_id menyimpan id barisnya). Karena kolom
     * "entitas" berisi nama tabel dan bukan nama kelas model penuh, morphTo
     * bawaan tidak bisa dipakai langsung — gunakan helper resolveEntitas()
     * di bawah untuk mengambil model aslinya.
     */
    public function resolveEntitas(): ?\Illuminate\Database\Eloquent\Model
    {
        $map = [
            'permits' => Permit::class,
            'screenings' => Screening::class,
            'gas_tests' => GasTest::class,
            'psb_forms' => PsbForm::class,
            'users' => User::class,
            // tambahkan mapping tabel -> model lain sesuai kebutuhan
        ];

        $modelClass = $map[$this->entitas] ?? null;

        if (! $modelClass || ! $this->entitas_id) {
            return null;
        }

        return $modelClass::find($this->entitas_id);
    }
}
