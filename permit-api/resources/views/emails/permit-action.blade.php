<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Permit SHE</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                        <td style="background-color:#0f766e; padding:20px 32px;">
                            <span style="color:#ffffff; font-size:18px; font-weight:700;">Digital Permit SHE</span>
                            <span style="color:#99f6e4; font-size:13px; display:block; margin-top:2px;">Safety, Health &amp; Environment</span>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 16px; font-size:15px; color:#334155;">
                                Halo, <strong>{{ $namaPenerima }}</strong>
                            </p>

                            <p style="margin:0 0 24px; font-size:15px; color:#334155; line-height:1.6;">
                                {{ $pesan }}
                            </p>

                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                                <tr>
                                    <td style="background-color:#0f766e; border-radius:8px;">
                                        <a href="{{ $linkPermit }}" target="_blank"
                                           style="display:inline-block; padding:12px 24px; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none;">
                                            Buka Detail Izin
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0; font-size:13px; color:#64748b; line-height:1.6;">
                                Nomor Izin: <strong>{{ $nomorIzin }}</strong><br>
                                Atau salin tautan berikut ke browser Anda:<br>
                                <a href="{{ $linkPermit }}" style="color:#0f766e; word-break:break-all;">{{ $linkPermit }}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding:20px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0;">
                            <p style="margin:0; font-size:12px; color:#94a3b8; line-height:1.5;">
                                Email ini dikirim otomatis oleh sistem Digital Permit SHE. Mohon tidak membalas email ini.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
