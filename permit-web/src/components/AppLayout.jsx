import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

// Kerangka aplikasi: sidebar kiri tetap, konten halaman di kanan.
// Dipasang sebagai induk semua route ter-proteksi, jadi setiap halaman
// otomatis mendapat sidebar tanpa perlu diedit satu per satu.
export default function AppLayout() {
  return (
    <div className="min-h-screen flex bg-slate-100">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
