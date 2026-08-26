import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { NotificationProvider } from "../context/NotificationContext";

// Kerangka aplikasi: sidebar kiri tetap, konten halaman di kanan.
// Dipasang sebagai induk semua route ter-proteksi, jadi setiap halaman
// otomatis mendapat sidebar tanpa perlu diedit satu per satu.
//
// NotificationProvider dipasang di sini (bukan di App.jsx) supaya hanya
// aktif untuk halaman yang sudah login — badge unread di Sidebar dan di
// NotificationBell header berbagi state yang sama dari sini.
export default function AppLayout() {
  return (
    <NotificationProvider>
      <div className="min-h-screen flex bg-slate-100">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </NotificationProvider>
  );
}
