<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;

class SchedulerTest extends ApiTestCase
{
    public function test_izin_aktif_lebih_dari_12_jam_otomatis_ditunda_dan_notifikasi_terkirim(): void
    {
        ['id' => $id, 'pa' => $pa] = $this->buatIzinAktif();

        // Mundurkan waktu transisi 'aktif' menjadi 13 jam lalu
        // (mensimulasikan izin yang sudah berjalan melewati validitas 12 jam).
        DB::table('permit_status_history')
            ->where('permit_id', $id)
            ->where('status', 'aktif')
            ->update(['changed_at' => now()->subHours(13)]);

        $this->artisan('permits:check-validity')->assertSuccessful();

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'ditunda']);

        // Notifikasi dikirim ke PA pemilik izin.
        $this->assertDatabaseHas('notifications', [
            'user_id'   => $pa->id,
            'permit_id' => $id,
            'dibaca'    => false,
        ]);
    }

    public function test_izin_melewati_masa_berlaku_otomatis_kadaluarsa(): void
    {
        ['id' => $id] = $this->buatIzinAktif();

        // Set tanggal kadaluarsa ke masa lalu (masa berlaku 72 jam terlewati).
        DB::table('permits')
            ->where('id', $id)
            ->update(['tgl_kadaluarsa' => now()->subHour()]);

        $this->artisan('permits:check-validity')->assertSuccessful();

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'kadaluarsa']);
    }

    public function test_izin_aktif_belum_12_jam_tidak_berubah(): void
    {
        ['id' => $id] = $this->buatIzinAktif();

        $this->artisan('permits:check-validity')->assertSuccessful();

        $this->assertDatabaseHas('permits', ['id' => $id, 'status' => 'aktif']);
    }
}
