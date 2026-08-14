<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// STEP 19 — cek validitas izin tiap menit
Schedule::command('permits:check-validity')->everyMinute();

// Rekap mingguan permit ke tim SHE — setiap Senin pukul 07:00
Schedule::command('permits:weekly-recap')->weeklyOn(1, '07:00');
