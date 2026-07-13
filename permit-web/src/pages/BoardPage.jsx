import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPermits } from "../services/permitService";
import StatusBadge from "../components/StatusBadge";
import { toast } from "sonner";
import { LayoutGrid, RefreshCw, ArrowLeft } from "lucide-react";

const KOLOM = [
  { key: "aktif", judul: "Aktif" },
  { key: "ditunda", judul: "Ditunda" },
  { key: "closed", judul: "Closed" },
];

export default function BoardPage() {
  const navigate = useNavigate();
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getPermits()
      .then((res) => setPermits(res.data.data))
      .catch(() => toast.error("Gagal memuat papan izin."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const byStatus = (st) => permits.filter((p) => p.status === st);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={16} /> Dashboard
        </button>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="text-emerald-600" size={22} />
            <h1 className="text-lg font-bold text-slate-800">Papan Izin Digital</h1>
          </div>
          <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
            <RefreshCw size={14} /> Segarkan
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Memuat...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {KOLOM.map((k) => (
              <div key={k.key} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-slate-800">{k.judul}</h2>
                  <span className="text-xs text-slate-400">{byStatus(k.key).length}</span>
                </div>
                <div className="space-y-2">
                  {byStatus(k.key).length === 0 ? (
                    <p className="text-xs text-slate-400">Tidak ada.</p>
                  ) : (
                    byStatus(k.key).map((p) => (
                      <button key={p.id} onClick={() => navigate(`/permits/${p.id}`)}
                        className="w-full text-left border border-slate-100 rounded-lg p-2 hover:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm text-slate-700">{p.nomor_izin}</span>
                          <StatusBadge status={p.status} />
                        </div>
                        <div className="text-xs text-slate-500">{(p.permit_types?.length ? p.permit_types : p.permit_type ? [p.permit_type] : []).map((t) => t.kode).join(" + ")} · {p.lokasi}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
