<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScreeningItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'screening_id',
        'no_kriteria',
        'deskripsi',
        'dicentang',
    ];

    protected function casts(): array
    {
        return [
            'dicentang' => 'boolean',
        ];
    }

    public function screening(): BelongsTo
    {
        return $this->belongsTo(Screening::class);
    }

    /**
     * Kriteria master (referensi) yang dijawab pada baris ini.
     * Dihubungkan lewat no_kriteria, bukan foreign key ber-ID.
     */
    public function criteria(): BelongsTo
    {
        return $this->belongsTo(ScreeningCriteria::class, 'no_kriteria', 'no_kriteria');
    }
}
