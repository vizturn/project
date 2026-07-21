<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PermitPersonnel extends Model
{
    use HasFactory;

    protected $table = 'permit_personnel';

    protected $fillable = [
        'permit_id',
        'user_id',
        'nama',
        'peran_pekerjaan',
        'telah_pelatihan_ketinggian',
    ];

    protected function casts(): array
    {
        return [
            'telah_pelatihan_ketinggian' => 'boolean',
        ];
    }

    public function permit(): BelongsTo
    {
        return $this->belongsTo(Permit::class);
    }

    /**
     * Akun user terkait, jika personel ini terdaftar sebagai user sistem.
     * Nullable karena bisa jadi pekerja lapangan tanpa akun (hanya nama).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Dokumen pendukung personel ini (MCU & sertifikat kompetensi).
     */
    public function documents(): HasMany
    {
        return $this->hasMany(PersonnelDocument::class);
    }
}
