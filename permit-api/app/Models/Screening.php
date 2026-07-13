<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Screening extends Model
{
    use HasFactory;

    protected $fillable = [
        'requested_by',
        'tanggal',
        'butuh_izin',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'butuh_izin' => 'boolean',
        ];
    }

    /**
     * User (PA/pemohon) yang mengajukan penapisan ini.
     */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * Daftar jawaban 43 kriteria penapisan untuk penapisan ini.
     */
    public function items(): HasMany
    {
        return $this->hasMany(ScreeningItem::class);
    }

    /**
     * Izin (permit) yang lahir dari hasil penapisan ini (jika butuh_izin = true).
     */
    public function permits(): HasMany
    {
        return $this->hasMany(Permit::class);
    }
}
