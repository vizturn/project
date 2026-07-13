<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PermitType extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode',
        'nama',
    ];

    /**
     * Semua izin (permit) yang menggunakan jenis izin ini.
     */
    public function permits(): HasMany
    {
        return $this->hasMany(Permit::class);
    }
}
