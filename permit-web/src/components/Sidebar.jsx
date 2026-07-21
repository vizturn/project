import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, ClipboardList, FileText, KanbanSquare,
  Bell, ScrollText, BarChart3, ShieldCheck, LogOut, UserCircle2,
} from "lucide-react";

// Definisi menu. `roles` kosong/undefined = tampil untuk semua peran.
// Kalau diisi, hanya peran tsb yang melihat menu ini (mengikuti RoleRoute di router).
const MENU = [
  { to: "/dashboard",     label: "Dashboard",    icon: LayoutDashboard },
  { to: "/screening",     label: "Penapisan",    icon: ClipboardList },
  { to: "/screening/new", label: "Buat Penapisan", icon: ClipboardList, roles: ["PA"] },
  { to: "/permits",       label: "Daftar Izin",  icon: FileText },
  { to: "/board",         label: "Papan Izin",   icon: KanbanSquare },
  { to: "/notifications", label: "Notifikasi",   icon: Bell },
  { to: "/audit-logs",    label: "Audit Log",    icon: ScrollText, roles: ["SHE", "ADM"] },
  { to: "/reports",       label: "Laporan",      icon: BarChart3,  roles: ["SHE", "ADM"] },
];

export default function Sidebar() {
  const { user, hasRole, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const menuTampil = MENU.filter((m) => !m.roles || hasRole(...m.roles));

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-5 py-5 flex items-center gap-2 border-b border-slate-100">
        <ShieldCheck className="text-emerald-600" size={24} />
        <div className="leading-tight">
          <p className="font-bold text-slate-800 text-sm">Digital Permit SHE</p>
          <p className="text-[11px] text-slate-400">Oil &amp; Gas Operations</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuTampil.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/screening"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`
            }
          >
            <Icon size={18} />
            {label}
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
