import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuditLogs, exportAuditLogs } from "../services/reportService";
import { toast } from "sonner";
import { ScrollText, ArrowLeft, Download } from "lucide-react";

export default function AuditLogPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter (semua opsional).
  const [filter, setFilter] = useState({
    tanggal_mulai: "",
    tanggal_selesai: "",
    aksi: "",
  });

  const muat = () => {
    setLoading(true);
    // Kirim hanya filter yang terisi.
    const params = {};
    if (filter.tanggal_mulai) params.tanggal_mulai = filter.tanggal_mulai;
    if (filter.tanggal_selesai) params.tanggal_selesai = filter.tanggal_selesai;
    if (filter.aksi.trim()) params.aksi = filter.aksi.trim();

    getAuditLogs(params)
      .then((res) => setLogs(res.data.data))
      .catch(() => toast.error("Gagal memuat audit log."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { muat(); }, []); // muat awal (tanpa filter)

  const terapkanFilter = () => muat();

  const resetFilter = () => {
    setFilter({ tanggal_mulai: "", tanggal_selesai: "", aksi: "" });
    setLoading(true);
    getAuditLogs({})
      .then((res) => setLogs(res.data.data))
      .catch(() => toast.error("Gagal memuat audit log."))
      .finally(() => setLoading(false));
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const params = {};
      if (filter.tanggal_mulai) params.tanggal_mulai = filter.tanggal_mulai;
      if (filter.tanggal_selesai) params.tanggal_selesai = filter.tanggal_selesai;
      if (filter.aksi.trim()) params.aksi = filter.aksi.trim();

      const res = await exportAuditLogs(params);
      // Buat link download dari blob CSV.
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Audit log diexport ke CSV.");
    } catch {
      toast.error("Gagal export audit log.");
    } finally {
      setExporting(false);
    }
  };

  const fmt = (d) => (d ? new Date(d).toLocaleString("id-ID") : "-");

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ScrollText className="text-emerald-600" size={22} />
              <h1 className="text-lg font-bold text-slate-800">Audit Log</h1>
            </div>
            <button
              onClick={exportCsv}
              disabled={exporting || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download size={16} /> {exporting ? "Mengexport..." : "Export CSV"}
            </button>
          </div>

          {/* Filter */}
          <div className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b border-slate-100">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tanggal mulai</label>
              <input
                type="date"
                value={filter.tanggal_mulai}
                onChange={(e) => setFilter((p) => ({ ...p, tanggal_mulai: e.target.value }))}
                className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tanggal selesai</label>
              <input
                type="date"
                value={filter.tanggal_selesai}
                onChange={(e) => setFilter((p) => ({ ...p, tanggal_selesai: e.target.value }))}
                className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Aksi</label>
              <input
                type="text"
                value={filter.aksi}
                onChange={(e) => setFilter((p) => ({ ...p, aksi: e.target.value }))}
                placeholder="mis. approve"
                className="px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <button onClick={terapkanFilter} className="px-3 py-1.5 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-800">
              Terapkan
            </button>
            <button onClick={resetFilter} className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-sm hover:bg-slate-50">
              Reset
            </button>
          </div>

          {loading ? <p className="text-slate-500 text-sm">Memuat...</p> : (
            logs.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">Tidak ada audit log untuk filter ini.</p>
            ) : (
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
            )
          )}
        </div>
      </div>
    </div>
  );
}
