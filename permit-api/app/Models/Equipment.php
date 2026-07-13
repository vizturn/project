<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Equipment extends Model
{
    use HasFactory;

    protected $table = 'equipment';

    protected $fillable = [
        'nama_alat',
        'status_kalibrasi',
        'tgl_kalibrasi',
    ];

    protected function casts(): array
    {
        return [
            'tgl_kalibrasi' => 'date',
        ];
    }

    /**
     * Semua izin yang menggunakan alat ini.
     */
    public function permits(): HasMany
    {
        return $this->hasMany(Permit::class);
    }
}
