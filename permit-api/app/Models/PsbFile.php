<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PsbFile extends Model
{
    use HasFactory;

    protected $table = 'psb_files';

    protected $fillable = [
        'permit_id',
        'diupload_oleh',
        'peran_pengupload',
        'file_path',
        'nama_asli',
    ];

    public function permit(): BelongsTo
    {
        return $this->belongsTo(Permit::class);
    }

    public function diuploadOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diupload_oleh');
    }
}
