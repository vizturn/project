<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PermitReference extends Model
{
    use HasFactory;

    protected $fillable = [
        'permit_id',
        'ref_confined_space_entry',
        'ref_bekerja_di_ketinggian',
        'ref_isolation',
        'sertifikat_scaffolding',
        'sertifikat_excavation',
        'sistem_safety_dinonaktifkan',
        'referensi_lainnya',
        'filled_by',
        'filled_at',
    ];

    protected function casts(): array
    {
        return [
            'filled_at' => 'datetime',
        ];
    }

    public function permit(): BelongsTo
    {
        return $this->belongsTo(Permit::class);
    }

    public function filledByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'filled_by');
    }
}
