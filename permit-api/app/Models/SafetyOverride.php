<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SafetyOverride extends Model
{
    use HasFactory;

    protected $fillable = [
        'permit_id',
        'sistem_keselamatan',
        'override_at',
        'override_by',
        'reinstate_at',
        'reinstate_by',
    ];

    protected function casts(): array
    {
        return [
            'override_at' => 'datetime',
            'reinstate_at' => 'datetime',
        ];
    }

    public function permit(): BelongsTo
    {
        return $this->belongsTo(Permit::class);
    }

    public function overrideBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'override_by');
    }

    public function reinstateBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reinstate_by');
    }

    /**
     * Belum dikembalikan (reinstate) -> masih berjalan timernya.
     */
    public function isOutstanding(): bool
    {
        return $this->reinstate_at === null;
    }
}
