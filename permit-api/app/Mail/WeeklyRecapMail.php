<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

/**
 * Email rekap mingguan untuk tim SHE.
 *
 * Berisi daftar semua permit yang diajukan (created_at) dalam rentang 1 minggu
 * dengan status aktif / ditunda(pending) / selesai / closed, lengkap dengan
 * nama pengaju (Performing Authority) dan jenis permit.
 *
 * Dikirim oleh command `permits:weekly-recap` (dijadwalkan Senin pagi).
 */
class WeeklyRecapMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  Collection  $permits  Koleksi permit yang sudah difilter & di-load relasinya.
     * @param  string  $periodeMulai  Label tanggal awal periode (untuk judul).
     * @param  string  $periodeSelesai  Label tanggal akhir periode.
     */
    public function __construct(
        public Collection $permits,
        public string $periodeMulai,
        public string $periodeSelesai,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Rekap Mingguan Permit to Work — {$this->periodeMulai} s.d. {$this->periodeSelesai}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.weekly-recap',
            with: [
                'permits'        => $this->permits,
                'periodeMulai'   => $this->periodeMulai,
                'periodeSelesai' => $this->periodeSelesai,
                'total'          => $this->permits->count(),
            ],
        );
    }
}
