<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pekerja yang diizinkan bekerja di ketinggian (Bagian 3 Persiapan WAH).
 * Nama diisi manual PA; sudah_pelatihan menandai apakah sudah ikut
 * pelatihan bekerja di ketinggian; sertifikat_pelatihan_file_path menyimpan
 * bukti sertifikat pelatihan tersebut (wajib jika sudah_pelatihan = true).
 */
class WahWorker extends Model
{
    protected $fillable = [
        'permit_id',
        'nama_pekerja',
        'sudah_pelatihan',
        'sertifikat_pelatihan_file_path',
    ];

    protected function casts(): array
    {
        return [
            'sudah_pelatihan' => 'boolean',
        ];
    }

    public function permit(): BelongsTo
    {
        return $this->belongsTo(Permit::class);
    }
}
