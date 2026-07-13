# permit-api (Laravel 12 + Sanctum) — Starter Step 1–4

Kerangka backend Digital Permit SHE. Sudah pra-pasang: Sanctum, CORS (origin http://localhost:5173),
api routing, route uji `/api/ping`, dan `HasApiTokens` di model User.

## Cara menjalankan (sekali setup)
1. composer install
2. php artisan key:generate
3. Nyalakan MySQL (XAMPP), buat database: `permit_she` (collation utf8mb4_unicode_ci)
4. Cek/isi `.env` (default sudah MySQL: root, tanpa password)
5. php artisan migrate
6. php artisan serve   -> http://localhost:8000

## Uji
Buka http://localhost:8000/api/ping  -> harus muncul JSON {"status":"ok",...}

## Catatan
- Folder `vendor/` sengaja tidak disertakan (regenerasi via composer install).
- Sanctum sudah masuk composer.json + config + migration, jadi TIDAK perlu `php artisan install:api`.
- Jika versi bentrok, alternatif: hapus baris sanctum dari composer.json lalu jalankan `php artisan install:api`.
