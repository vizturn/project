<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = ['user_id', 'permit_id', 'pesan', 'dibaca'];

    protected $casts = ['dibaca' => 'boolean'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function permit()
    {
        return $this->belongsTo(Permit::class);
    }
}
