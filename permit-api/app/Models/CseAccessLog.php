<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Catatan masuk/keluar ruang terbatas (Bagian 7 CSE).
 * Diisi Petugas Jaga saat personel masuk dan saat keluar.
 */
class CseAccessLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'permit_id',
        'nama_pekerja',
        'tanggal',
        'jam_masuk',
        'jam_keluar',
        'catatan',
        'dicatat_oleh',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
        ];
    }

    public function permit(): BelongsTo
    {
        return $this->belongsTo(Permit::class);
    }

    public function dicatatOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dicatat_oleh');
    }
}
