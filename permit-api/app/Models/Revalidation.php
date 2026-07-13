<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Revalidation extends Model
{
    use HasFactory;

    protected $fillable = [
        'permit_id',
        'returned_at',
        'returned_by',
        'revalidated_at',
        'revalidated_by',
    ];

    protected function casts(): array
    {
        return [
            'returned_at' => 'datetime',
            'revalidated_at' => 'datetime',
        ];
    }

    public function permit(): BelongsTo
    {
        return $this->belongsTo(Permit::class);
    }

    public function returnedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_by');
    }

    public function revalidatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revalidated_by');
    }

    /**
     * Belum direvalidasi -> masih berjalan timernya.
     */
    public function isPending(): bool
    {
        return $this->revalidated_at === null;
    }
}
