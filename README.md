# Digital Permit SHE — Starter (Step 1–4)

Dua project terpisah:
- permit-api/  -> Backend Laravel 12 + Sanctum (API)
- permit-web/  -> Frontend React 18 + Vite + Tailwind v4

## Urutan menjalankan
1. Backend dulu (lihat permit-api/README.md): composer install -> migrate -> serve (port 8000)
2. Frontend (lihat permit-web/README.md): npm install -> npm run dev (port 5173)
3. Uji koneksi lewat tombol "Cek Koneksi" di http://localhost:5173

## PENTING
- `vendor/` dan `node_modules/` sengaja TIDAK disertakan (ukuran besar).
  Regenerasi: composer install (backend), npm install (frontend).
- Ini fondasi Step 1–4 (setup + uji koneksi). Fitur (penapisan, permit, dll) dibangun di step berikutnya.
- Sisi React sudah diverifikasi build. Sisi Laravel = skeleton resmi + patch; jalankan composer install untuk memastikan di mesinmu.
