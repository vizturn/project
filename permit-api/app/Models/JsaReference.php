<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JsaReference extends Model
{
    use HasFactory;

    protected $table = 'jsa_references';

    protected $fillable = [
        'permit_id',
        'nomor_jsa',
        'tingkat_risiko',
    ];

    public function permit(): BelongsTo
    {
        return $this->belongsTo(Permit::class);
    }
}
