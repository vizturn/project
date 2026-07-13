<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ScreeningCriteriaSeeder extends Seeder
{
    public function run(): void
    {
        $kriteria = [
            1  => 'Pekerjaan dilaksanakan oleh mitra kerja (kontraktor)',
            2  => 'Lokasi pekerjaan memiliki potensi kekurangan oksigen atau kelebihan kadar oksigen',
            3  => 'Terdapat potensi atmosfer yang mudah terbakar atau meledak',
            4  => 'Lingkungan kerja memiliki potensi suhu ekstrem atau tekanan tinggi',
            5  => 'Pekerjaan menimbulkan paparan terhadap bahan kimia berbahaya dan beracun',
            6  => 'Pekerjaan dilakukan di ruang terbatas (confined space)',
            7  => 'Pekerjaan dilakukan di ketinggian',
            8  => 'Perbaikan, pemeliharaan, atau pemeriksaan terhadap instalasi kelistrikan',
            9  => 'Perbaikan atau pemeliharaan peralatan, atau pekerjaan di lokasi dengan potensi bahaya',
            10 => 'Kegiatan penggalian',
            11 => 'Pengoperasian alat berat',
            12 => 'Pekerjaan yang melibatkan mesin berputar atau bergerak',
            13 => 'Pekerjaan yang berhubungan dengan bahan radioaktif',
            14 => 'Penguncian atau isolasi terhadap sumber energi berbahaya (lock out/tag out)',
            15 => 'Pekerjaan penyelaman (diving work)',
            16 => 'Pekerjaan di area yang terdapat potensi keberadaan binatang berbisa',
            17 => 'Pekerjaan yang berdasarkan lesson learned pernah menyebabkan insiden',
            18 => 'Pekerjaan dengan near miss kategori High Potential Incident (HIPO)',
            19 => 'Pekerjaan tidak rutin, berisiko tinggi, atau memerlukan pengendalian keselamatan tambahan',
            20 => 'Pengujian tekanan pada instalasi atau peralatan',
            21 => 'Pemutusan, pembukaan, atau penutupan pipa/peralatan yang mengandung atau pernah mengandung bahan mudah terbakar atau beracun',
            22 => 'Penutupan atau pembukaan jalur hidrokarbon',
            23 => 'Pembersihan kimia',
            24 => 'Pekerjaan kelistrikan pada peralatan/instrumen yang telah diisolasi dan dibumikan (nonaktif)',
            25 => 'Pengoperasian well service atau wireline',
            26 => 'Pengoperasian workover non-standar',
            27 => 'Penanganan bahan berbahaya (radioaktif, kimia toksik/korosif, asbes)',
            28 => 'Pengangkatan beban berat (contoh: kepala sumur/wellhead)',
            29 => 'Pemasangan dan pembongkaran perancah (scaffolding)',
            30 => 'Pemindahan grating atau handrail',
            31 => 'Penggunaan personal basket',
            32 => 'Pekerjaan di area yang memiliki potensi jatuh ke badan air (sungai, laut)',
            33 => 'Pekerjaan di area dengan potensi bahaya akibat benda jatuh',
            34 => 'Pemeliharaan yang menonaktifkan sistem keselamatan kritikal',
            35 => 'Pengelasan, pemotongan, pembakaran, gerinda, solder, atau pekerjaan serupa dengan listrik aktif',
            36 => 'Pekerjaan hot tapping',
            37 => 'Sand blasting dan pengelupasan permukaan',
            38 => 'Penggunaan zat berbahaya seperti radiografi atau bahan peledak',
            39 => 'Pekerjaan pemotongan rumput di area proses',
            40 => 'Pengecatan di area proses',
            41 => 'Penggunaan peralatan yang menimbulkan percikan api di area berbahaya',
            42 => 'Penggunaan peralatan listrik non-explosion proof di area berbahaya',
            43 => 'Pekerjaan yang berdasarkan evaluasi risiko, memerlukan izin kerja',
        ];

        foreach ($kriteria as $no => $deskripsi) {
            DB::table('screening_criteria')->updateOrInsert(
                ['no_kriteria' => $no],
                ['deskripsi' => $deskripsi, 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }
}
