import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut, ShieldCheck, ClipboardList, FileText, LayoutGrid, Bell, ScrollText, BarChart3 } from "lucide-react";

export default function DashboardPage() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Berhasil logout.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <h1 className="font-bold text-slate-800">Digital Permit SHE</h1>
        <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-slate-600 hover:text-red-600">
          <LogOut size={16} /> Logout
        </button>
      </header>

      <main className="p-6 space-y-6">
        <div className="bg-white rounded-xl shadow p-6 max-w-lg">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="text-emerald-600" size={20} />
            <h2 className="font-semibold text-slate-800">Selamat datang, {user?.name}</h2>
          </div>
          <dl className="text-sm text-slate-600 space-y-1">
            <div><span className="font-medium">Email:</span> {user?.email}</div>
            <div><span className="font-medium">Jabatan:</span> {user?.jabatan || "-"}</div>
            <div className="flex gap-1 items-center">
              <span className="font-medium">Role:</span>
              {user?.roles?.map((r) => (
                <span key={r} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs">{r}</span>
              ))}
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
          <button onClick={() => navigate("/screening")} className="bg-white rounded-xl shadow p-5 text-left hover:shadow-md transition">
            <ClipboardList className="text-emerald-600 mb-2" size={22} />
            <div className="font-semibold text-slate-800">Penapisan</div>
            <div className="text-sm text-slate-500">Tentukan apakah pekerjaan butuh izin kerja.</div>
          </button>
          <button onClick={() => navigate("/permits")} className="bg-white rounded-xl shadow p-5 text-left hover:shadow-md transition">
            <FileText className="text-emerald-600 mb-2" size={22} />
            <div className="font-semibold text-slate-800">Izin Kerja</div>
            <div className="text-sm text-slate-500">Ajukan, setujui, uji gas, dan terbitkan izin.</div>
          </button>
          <button onClick={() => navigate("/board")} className="bg-white rounded-xl shadow p-5 text-left hover:shadow-md transition">
            <LayoutGrid className="text-emerald-600 mb-2" size={22} />
            <div className="font-semibold text-slate-800">Papan Izin</div>
            <div className="text-sm text-slate-500">Pantau izin Aktif / Ditunda / Closed real-time.</div>
          </button>
          <button onClick={() => navigate("/notifications")} className="bg-white rounded-xl shadow p-5 text-left hover:shadow-md transition">
            <Bell className="text-emerald-600 mb-2" size={22} />
            <div className="font-semibold text-slate-800">Notifikasi</div>
            <div className="text-sm text-slate-500">Pemberitahuan izin ditunda / kadaluarsa.</div>
          </button>
          {(hasRole("SHE") || hasRole("ADM")) && (
            <>
              <button onClick={() => navigate("/audit-logs")} className="bg-white rounded-xl shadow p-5 text-left hover:shadow-md transition">
                <ScrollText className="text-emerald-600 mb-2" size={22} />
                <div className="font-semibold text-slate-800">Audit Log</div>
                <div className="text-sm text-slate-500">Jejak seluruh aksi sistem.</div>
              </button>
              <button onClick={() => navigate("/reports")} className="bg-white rounded-xl shadow p-5 text-left hover:shadow-md transition">
                <BarChart3 className="text-emerald-600 mb-2" size={22} />
                <div className="font-semibold text-slate-800">Rekap Evaluasi</div>
                <div className="text-sm text-slate-500">Statistik izin untuk evaluasi SHE.</div>
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
