import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markNotificationRead } from "../services/notificationService";
import { toast } from "sonner";
import { Bell, ArrowLeft } from "lucide-react";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getNotifications()
      .then((res) => setList(res.data.data))
      .catch(() => toast.error("Gagal memuat notifikasi."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const baca = async (n) => {
    if (n.dibaca) return;
    try { await markNotificationRead(n.id); load(); } catch { /* abaikan */ }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="text-emerald-600" size={22} />
            <h1 className="text-lg font-bold text-slate-800">Notifikasi</h1>
          </div>
          {loading ? (
            <p className="text-slate-500 text-sm">Memuat...</p>
          ) : list.length === 0 ? (
            <p className="text-slate-500 text-sm">Belum ada notifikasi.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {list.map((n) => (
                <li key={n.id} onClick={() => baca(n)}
                  className={`py-3 px-2 cursor-pointer rounded ${n.dibaca ? "text-slate-500" : "bg-emerald-50 text-slate-800 font-medium"}`}>
                  {n.pesan}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
