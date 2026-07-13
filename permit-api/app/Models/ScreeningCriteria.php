<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScreeningCriteria extends Model
{
    use HasFactory;

    protected $table = 'screening_criteria';

    protected $fillable = [
        'no_kriteria',
        'deskripsi',
    ];

    /**
     * Catatan: tabel ini adalah master (referensi 43 kriteria penapisan).
     * Baris "screening_items" pada satu screening menyalin no_kriteria + deskripsi
     * dari sini, sehingga tidak ada foreign key langsung. Relasi berikut
     * disediakan agar tetap bisa ditelusuri lewat kolom no_kriteria.
     */
    public function screeningItems()
    {
        return $this->hasMany(ScreeningItem::class, 'no_kriteria', 'no_kriteria');
    }
}
