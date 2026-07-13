import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getScreenings } from "../services/screeningService";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Plus, ClipboardList, ArrowLeft } from "lucide-react";

export default function ScreeningListPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getScreenings()
      .then((res) => setList(res.data.data))
      .catch(() => toast.error("Gagal memuat daftar penapisan."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={16} /> Dashboard
        </button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="text-emerald-600" size={22} />
              <h1 className="text-lg font-bold text-slate-800">Daftar Penapisan</h1>
            </div>
            {hasRole("PA") && (
              <button onClick={() => navigate("/screening/new")} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700">
                <Plus size={16} /> Penapisan Baru
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-slate-500 text-sm">Memuat...</p>
          ) : list.length === 0 ? (
            <p className="text-slate-500 text-sm">Belum ada penapisan.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Tanggal</th>
                  <th className="py-2">Pemohon</th>
                  <th className="py-2">Kriteria</th>
                  <th className="py-2">Hasil</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="py-2">{new Date(s.tanggal).toLocaleDateString("id-ID")}</td>
                    <td className="py-2">{s.pemohon?.name ?? "-"}</td>
                    <td className="py-2">{s.items_count}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${s.butuh_izin ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                        {s.butuh_izin ? "Butuh izin" : "Tidak perlu"}
                      </span>
                    </td>
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
