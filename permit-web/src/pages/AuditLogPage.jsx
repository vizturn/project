import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuditLogs } from "../services/reportService";
import { toast } from "sonner";
import { ScrollText, ArrowLeft } from "lucide-react";

export default function AuditLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs()
      .then((res) => setLogs(res.data.data))
      .catch(() => toast.error("Gagal memuat audit log."))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (d) => (d ? new Date(d).toLocaleString("id-ID") : "-");

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="text-emerald-600" size={22} />
            <h1 className="text-lg font-bold text-slate-800">Audit Log</h1>
          </div>
          {loading ? <p className="text-slate-500 text-sm">Memuat...</p> : (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-2">Waktu</th><th>Pengguna</th><th>Aksi</th><th>Entitas</th><th>ID</th>
              </tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-slate-100">
                    <td className="py-1.5">{fmt(l.logged_at)}</td>
                    <td>{l.user?.name ?? "sistem"}</td>
                    <td className="font-medium text-slate-700">{l.aksi}</td>
                    <td>{l.entitas}</td>
                    <td>{l.entitas_id ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
