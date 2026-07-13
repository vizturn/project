import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSummary } from "../services/reportService";
import { statusLabel } from "../lib/status";
import { toast } from "sonner";
import { BarChart3, ArrowLeft } from "lucide-react";

export default function ReportPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSummary()
      .then((res) => setData(res.data.data))
      .catch(() => toast.error("Gagal memuat rekap."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="text-emerald-600" size={22} />
            <h1 className="text-lg font-bold text-slate-800">Rekap Izin Kerja</h1>
          </div>
          {loading ? <p className="text-slate-500 text-sm">Memuat...</p> : !data ? null : (
            <div className="space-y-6">
              <div className="text-sm text-slate-600">Total izin: <span className="font-bold text-slate-800">{data.total}</span></div>
              <div>
                <h2 className="font-semibold text-slate-700 mb-2">Per Status</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(data.by_status || {}).map(([k, v]) => (
                    <div key={k} className="border border-slate-100 rounded-lg p-3">
                      <div className="text-xs text-slate-500">{statusLabel(k)}</div>
                      <div className="text-lg font-bold text-slate-800">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-slate-700 mb-2">Per Jenis Izin</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(data.by_type || {}).map(([k, v]) => (
                    <div key={k} className="border border-slate-100 rounded-lg p-3">
                      <div className="text-xs text-slate-500">{k}</div>
                      <div className="text-lg font-bold text-slate-800">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
