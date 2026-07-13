<?php

namespace App\Services;

/**
 * Simulasi data dari sistem eksternal EMP Bentu (SSO/WO/Alat).
 * Saat integrasi nyata tersedia, ganti isi method ini dengan panggilan HTTP/DB
 * ke sistem sumber tanpa mengubah pemakainya (integration-ready).
 */
class MockIntegrationService
{
    public function workOrders(): array
    {
        return [
            ['wo_number' => 'WO-2026-0001', 'deskripsi' => 'Perbaikan pompa transfer SP-A'],
            ['wo_number' => 'WO-2026-0002', 'deskripsi' => 'Inspeksi pipa header gas'],
            ['wo_number' => 'WO-2026-0003', 'deskripsi' => 'Perawatan tangki timbun T-101'],
            ['wo_number' => 'WO-2026-0004', 'deskripsi' => 'Penggantian valve manifold'],
        ];
    }

    public function equipment(): array
    {
        return [
            ['nama_alat' => 'Gas Detector Multi-RAE #GD-01', 'status_kalibrasi' => 'valid',   'tgl_kalibrasi' => '2026-03-01'],
            ['nama_alat' => 'Crane 25T #CR-02',              'status_kalibrasi' => 'valid',   'tgl_kalibrasi' => '2026-01-15'],
            ['nama_alat' => 'Welding Machine #WM-07',        'status_kalibrasi' => 'valid',   'tgl_kalibrasi' => '2026-02-20'],
            ['nama_alat' => 'Scaffolding Set #SC-11',        'status_kalibrasi' => 'expired', 'tgl_kalibrasi' => '2025-06-10'],
        ];
    }
}
