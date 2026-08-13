<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GasTest extends Model
{
    use HasFactory;

    protected $fillable = [
        'permit_id',
        'agt_id',
        'petugas_nama',
        'fase',
        'tanggal',
        'jam',
        'lel_persen',
        'oksigen_persen',
        'co_ppm',
        'h2s_ppm',
        'foto_path',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'lel_persen' => 'decimal:2',
            'oksigen_persen' => 'decimal:2',
            'co_ppm' => 'decimal:2',
            'h2s_ppm' => 'decimal:2',
        ];
    }

    public function permit(): BelongsTo
    {
        return $this->belongsTo(Permit::class);
    }

    /**
     * AGT (Authorized Gas Tester) yang login & menginput uji gas ini.
     * Catatan: ini akun sistem si penginput, BUKAN nama petugas lapangan —
     * nama petugas lapangan yang sebenarnya melaksanakan pengetesan dicatat
     * manual di kolom `petugas_nama`.
     */
    public function agt(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agt_id');
    }
}
