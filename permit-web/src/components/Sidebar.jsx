import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import {
  LayoutDashboard, FileText, KanbanSquare,
  Bell, ScrollText, CalendarClock, BarChart3, LogOut, UserCircle2, UserCheck,
} from "lucide-react";

// Definisi menu. `roles` kosong/undefined = tampil untuk semua peran.
// Kalau diisi, hanya peran tsb yang melihat menu ini (mengikuti RoleRoute di router).
// `hideForRoles` = kebalikannya: peran yang disebut TIDAK melihat menu ini
// meski peran lain yang memenuhi `roles` tetap melihatnya.
//
// Catatan: menu "Penapisan" dan "Buat Penapisan" sengaja DIHAPUS. Penapisan
// bukan lagi aktivitas berdiri sendiri, melainkan langkah pertama yang otomatis
// dilalui saat PA mengajukan izin baru (sesuai SOP EMP pasal 7: penapisan yang
// menentukan apakah suatu pekerjaan wajib berizin). Rute /screening dan
// /screening/new tetap hidup di router, sehingga riwayat penapisan masih dapat
// dibuka bila nanti dibutuhkan untuk audit SHE.
const MENU = [
  { to: "/dashboard",     label: "Dashboard",    icon: LayoutDashboard },
  { to: "/permits",       label: "Daftar Izin",  icon: FileText, hideForRoles: ["SHE", "ADM"] },
  { to: "/board",         label: "Papan Izin",   icon: KanbanSquare },
  { to: "/notifications", label: "Notifikasi",   icon: Bell },
  { to: "/audit-logs",    label: "Audit Log",    icon: ScrollText, roles: ["SHE", "ADM"] },
  { to: "/permit-logs",   label: "Log Izin Harian", icon: CalendarClock, roles: ["SHE", "ADM"], hideForRoles: ["ADM"] },
  { to: "/reports",       label: "Laporan",      icon: BarChart3,  roles: ["SHE", "ADM"], hideForRoles: ["SHE", "ADM"] },
  { to: "/accounts/approval", label: "Persetujuan Akun", icon: UserCheck, roles: ["SHE"] },
  { to: "/accounts/manage", label: "Kelola Akun", icon: UserCircle2, roles: ["ADM"] },
];

export default function Sidebar() {
  const { user, hasRole, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const menuTampil = MENU.filter((m) => {
    if (m.roles && !hasRole(...m.roles)) return false;
    if (m.hideForRoles && hasRole(...m.hideForRoles)) return false;
    return true;
  });

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-5 py-5 flex items-center gap-2 border-b border-slate-100">
        <img src="/emp-logo.png" alt="EMP" className="h-8 w-auto block" />
        <div className="leading-tight">
          <p className="font-bold text-slate-800 text-sm">Bentu Limited</p>
          <p className="text-[11px] text-slate-400">Korinci Baru</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuTampil.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            {to === "/notifications" && unreadCount > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer: profil + logout */}
      <div className="border-t border-slate-100 p-3">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50"
            }`
          }
        >
          <UserCircle2 size={20} className="text-slate-400" />
          <span className="min-w-0">
            <span className="block font-medium truncate">{user?.name ?? "Pengguna"}</span>
            <span className="block text-[11px] text-slate-400 truncate">{user?.jabatan ?? "—"}</span>
          </span>
        </NavLink>
        <button
          onClick={doLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} /> Keluar
        </button>
      </div>
    </aside>
  );
}
