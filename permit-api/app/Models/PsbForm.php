<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PsbForm extends Model
{
    use HasFactory;

    protected $table = 'psb_forms';

    protected $fillable = [
        'permit_id',
        'permit_type_id',
        'psb_type_id',
        'diisi_oleh',
        'status',
    ];

    public function permit(): BelongsTo
    {
        return $this->belongsTo(Permit::class);
    }

    public function permitType(): BelongsTo
    {
        return $this->belongsTo(PermitType::class);
    }

    public function psbType(): BelongsTo
    {
        return $this->belongsTo(PsbType::class);
    }

    public function diisiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diisi_oleh');
    }
}
