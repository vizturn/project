# permit-web (React 18 + Vite + Tailwind v4) — Starter Step 1–4

Frontend Digital Permit SHE. Sudah terpasang: React Router, Axios (layer services),
Lucide React, Sonner, Tailwind v4, struktur folder, dan halaman uji koneksi.

## Cara menjalankan (sekali setup)
1. npm install
2. npm run dev   -> http://localhost:5173

## Struktur
- src/services/api.js        -> instance Axios terpusat (+ interceptor token)
- src/services/testService.js-> pingBackend() untuk uji koneksi
- src/context, router, pages, components, hooks, lib -> kerangka kosong (diisi di step berikutnya)
- .env -> VITE_API_URL=http://localhost:8000/api  (restart dev server tiap ubah .env)

## Uji koneksi
Pastikan backend jalan (php artisan serve), lalu klik tombol "Cek Koneksi".
Berhasil = toast hijau + JSON dari /api/ping.

## Catatan
- Folder `node_modules/` tidak disertakan (regenerasi via npm install).
- React di-pin ke v18 sesuai stack project.
