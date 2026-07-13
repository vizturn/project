<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'wo_number',
        'deskripsi',
    ];

    /**
     * Semua izin yang dibuat berdasarkan work order ini.
     */
    public function permits(): HasMany
    {
        return $this->hasMany(Permit::class, 'wo_id');
    }
}
