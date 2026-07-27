<?php

namespace App\Mail;

use App\Models\Permit;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Email notifikasi untuk event permit yang "butuh aksi" atau merupakan
 * milestone penting (disetujui, ditolak, diterbitkan, ditugaskan, dll).
 *
 * Dikirim dari trait HasPermitNotifications::notif() HANYA bila pemanggil
 * menandai $kirimEmail = true. Isi email = pesan notifikasi in-app yang sama,
 * plus tautan langsung ke halaman detail izin.
 *
 * CATATAN QUEUE: untuk mengirim di background (tidak membuat pengguna menunggu
 * proses SMTP), tambahkan "implements ShouldQueue" pada class ini DAN jalankan
 * worker: `php artisan queue:work`. Untuk sekarang email dikirim sinkron agar
 * mudah diuji tanpa worker. Lihat QUEUE_CONNECTION=database di .env.
 */
class PermitActionMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $penerima,
        public Permit $permit,
        public string $pesan,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Digital Permit SHE — {$this->permit->nomor_izin}",
        );
    }

    public function content(): Content
    {
        // URL frontend ke halaman detail izin. Diambil dari config app.frontend_url
        // (fallback ke APP_URL) agar tautan bisa berbeda antara dev & produksi
        // tanpa mengubah kode.
        $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
        $linkPermit = "{$frontendUrl}/permits/{$this->permit->id}";

        return new Content(
            view: 'emails.permit-action',
            with: [
                'namaPenerima' => $this->penerima->name,
                'pesan'        => $this->pesan,
                'nomorIzin'    => $this->permit->nomor_izin,
                'linkPermit'   => $linkPermit,
            ],
        );
    }
}
