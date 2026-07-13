<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PersonnelDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'permit_personnel_id',
        'jenis',
        'nomor',
        'masa_berlaku',
    ];

    protected function casts(): array
    {
        return [
            'masa_berlaku' => 'date',
        ];
    }

    public function permitPersonnel(): BelongsTo
    {
        return $this->belongsTo(PermitPersonnel::class);
    }

    /**
     * Apakah dokumen ini sudah kedaluwarsa (dibanding tanggal hari ini).
     */
    public function isExpired(): bool
    {
        return $this->masa_berlaku !== null && $this->masa_berlaku->isPast();
    }
}
