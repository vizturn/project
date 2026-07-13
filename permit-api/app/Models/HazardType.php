<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HazardType extends Model
{
    protected $fillable = ['permit_type_id', 'no_bahaya', 'deskripsi'];

    public function permitType(): BelongsTo
    {
        return $this->belongsTo(PermitType::class);
    }
}
