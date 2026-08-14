<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rekap Mingguan Permit to Work</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="720" cellpadding="0" cellspacing="0" style="max-width:720px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                        <td style="background-color:#0f766e; padding:20px 32px;">
                            <span style="color:#ffffff; font-size:18px; font-weight:700;">Rekap Mingguan Permit to Work</span>
                            <span style="color:#99f6e4; font-size:13px; display:block; margin-top:2px;">Safety, Health &amp; Environment</span>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:28px 32px;">
                            <p style="margin:0 0 6px; font-size:15px; color:#334155;">
                                Periode: <strong>{{ $periodeMulai }}</strong> s.d. <strong>{{ $periodeSelesai }}</strong>
                            </p>
                            <p style="margin:0 0 20px; font-size:14px; color:#64748b;">
                                Total {{ $total }} permit diajukan dalam periode ini (status aktif, ditunda, selesai, atau closed).
                            </p>

                            @if ($total === 0)
                                <p style="margin:0; padding:16px; background:#f8fafc; border-radius:8px; font-size:14px; color:#64748b; text-align:center;">
                                    Tidak ada permit yang diajukan dalam periode ini.
                                </p>
                            @else
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:13px;">
                                    <thead>
                                        <tr style="background-color:#f1f5f9;">
                                            <th style="padding:10px 8px; text-align:left; color:#475569; border-bottom:2px solid #e2e8f0;">No</th>
                                            <th style="padding:10px 8px; text-align:left; color:#475569; border-bottom:2px solid #e2e8f0;">Nomor Izin</th>
                                            <th style="padding:10px 8px; text-align:left; color:#475569; border-bottom:2px solid #e2e8f0;">Jenis</th>
                                            <th style="padding:10px 8px; text-align:left; color:#475569; border-bottom:2px solid #e2e8f0;">Pengaju (PA)</th>
                                            <th style="padding:10px 8px; text-align:left; color:#475569; border-bottom:2px solid #e2e8f0;">Status</th>
                                            <th style="padding:10px 8px; text-align:left; color:#475569; border-bottom:2px solid #e2e8f0;">Tanggal Diajukan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        @foreach ($permits as $i => $permit)
                                            <tr style="background-color:{{ $i % 2 === 0 ? '#ffffff' : '#f8fafc' }};">
                                                <td style="padding:9px 8px; color:#334155; border-bottom:1px solid #e2e8f0;">{{ $i + 1 }}</td>
                                                <td style="padding:9px 8px; color:#334155; border-bottom:1px solid #e2e8f0; font-weight:600;">{{ $permit->nomor_izin ?? '-' }}</td>
                                                <td style="padding:9px 8px; color:#334155; border-bottom:1px solid #e2e8f0;">{{ $permit->permitTypes->pluck('kode')->implode(', ') ?: '-' }}</td>
                                                <td style="padding:9px 8px; color:#334155; border-bottom:1px solid #e2e8f0;">{{ $permit->performingAuthority->name ?? '-' }}</td>
                                                <td style="padding:9px 8px; border-bottom:1px solid #e2e8f0;">
                                                    <span style="display:inline-block; padding:2px 8px; border-radius:10px; font-size:12px; background:#e0f2fe; color:#075985;">{{ $permit->status }}</span>
                                                </td>
                                                <td style="padding:9px 8px; color:#64748b; border-bottom:1px solid #e2e8f0;">{{ $permit->created_at?->format('d/m/Y') ?? '-' }}</td>
                                            </tr>
                                        @endforeach
                                    </tbody>
                                </table>
                            @endif

                            <p style="margin:24px 0 0; font-size:12px; color:#94a3b8; line-height:1.6;">
                                Email ini dikirim otomatis oleh sistem Digital Permit SHE setiap Senin pagi.
                                Rekap ini untuk keperluan monitoring dan dokumentasi K3.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f8fafc; padding:16px 32px; border-top:1px solid #e2e8f0;">
                            <span style="color:#94a3b8; font-size:12px;">Digital Permit SHE &middot; EMP Bentu Limited</span>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
