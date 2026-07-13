<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StandbyLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'permit_id',
        'petugas_jaga_id',
        'nama_pekerja',
        'waktu_masuk',
        'waktu_keluar',
    ];

    protected function casts(): array
    {
        return [
            'waktu_masuk' => 'datetime',
            'waktu_keluar' => 'datetime',
        ];
    }

    public function permit(): BelongsTo
    {
        return $this->belongsTo(Permit::class);
    }

    /**
     * Petugas jaga (PJ) yang mencatat log ini.
     */
    public function petugasJaga(): BelongsTo
    {
        return $this->belongsTo(User::class, 'petugas_jaga_id');
    }

    /**
     * Pekerja masih di dalam area (belum tercatat waktu keluar).
     */
    public function isMasihDiDalam(): bool
    {
        return $this->waktu_keluar === null;
    }
}
