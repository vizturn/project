<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PsbType extends Model
{
    use HasFactory;

    protected $fillable = [
        'kode',
        'nama',
    ];

    /**
     * Semua form PSB yang menggunakan jenis PSB ini.
     */
    public function psbForms(): HasMany
    {
        return $this->hasMany(PsbForm::class);
    }
}
