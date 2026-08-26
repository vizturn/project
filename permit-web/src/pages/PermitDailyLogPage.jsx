import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPermitLogs, exportPermitLogs } from "../services/reportService";
import { statusLabel, statusClass } from "../lib/status";
import { toast } from "sonner";
import { CalendarClock, ArrowLeft, Download } from "lucide-react";

// Format Date -> "YYYY-MM-DD" (sesuai format yang diterima backend).
const keyTanggal = (d) => d.toISOString().slice(0, 10);

// Preset rentang tanggal. "1 minggu" & "1 bulan" dihitung mundur dari hari
// ini (inklusif), bukan awal minggu/bulan kalender.
const PRESET = {
  hari_ini: { label: "Hari Ini", hariMundur: 0 },
  minggu:   { label: "1 Minggu", hariMundur: 6 },
  bulan:    { label: "1 Bulan",  hariMundur: 29 },
};

function rentangPreset(kode) {
  const selesai = new Date();
  const mulai = new Date();
  mulai.setDate(mulai.getDate() - PRESET[kode].hariMundur);
  return { tanggal_mulai: keyTanggal(mulai), tanggal_selesai: keyTanggal(selesai) };
}

// Label tanggal untuk header grup, mis. "Senin, 24 Agustus 2026".
function labelHari(tgl) {
  return new Date(tgl).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export default function PermitDailyLogPage() {
  const navigate = useNavigate();
  const [preset, setPreset] = useState("hari_ini");
  const [permits, setPermits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const muat = (kode) => {
    setLoading(true);
    getPermitLogs(rentangPreset(kode))
      .then((res) => setPermits(res.data.data))
      .catch(() => toast.error("Gagal memuat log izin harian."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { muat(preset); }, [preset]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await exportPermitLogs(rentangPreset(preset));
      const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `log-izin-harian-${keyTanggal(new Date())}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Log izin diexport ke CSV.");
    } catch {
      toast.error("Gagal export log izin.");
    } finally {
      setExporting(false);
    }
  };

  // Kelompokkan per tanggal (created_at) — supaya izin yang masuk di satu
  // hari tampil bersama di bawah satu judul tanggal, sesuai permintaan.
  const kelompok = permits.reduce((acc, p) => {
    const k = keyTanggal(new Date(p.created_at));
    (acc[k] ??= []).push(p);
    return acc;
  }, {});
  const tanggalUrut = Object.keys(kelompok).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={16} /> Dashboard
        </button>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="text-emerald-600" size={22} />
              <h1 className="text-lg font-bold text-slate-800">Log Izin Harian</h1>
            </div>
            <button
              onClick={exportCsv}
              disabled={exporting || loading || permits.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download size={16} /> {exporting ? "Mengexport..." : "Export CSV"}
            </button>
          </div>

          {/* Filter preset */}
          <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-slate-100">
            {Object.entries(PRESET).map(([kode, p]) => (
              <button
                key={kode}
                onClick={() => setPreset(kode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  preset === kode
                    ? "bg-slate-800 text-white"
                    : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
            <span className="text-xs text-slate-400 ml-1">
              Izin yang diajukan pada rentang tanggal terpilih, dikelompokkan per hari.
            </span>
          </div>

          {loading ? <p className="text-slate-500 text-sm">Memuat...</p> : (
            permits.length === 0 ? (
              <p className="text-slate-400 text-sm py-4 text-center">Tidak ada izin masuk pada rentang ini.</p>
            ) : (
              <div className="space-y-6">
                {tanggalUrut.map((tgl) => (
                  <div key={tgl}>
                    <h2 className="text-sm font-semibold text-slate-700 mb-2">
                      {labelHari(tgl)}
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        {kelompok[tgl].length} izin masuk
                      </span>
                    </h2>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-200">
                          <th className="py-2">Nomor Izin</th>
                          <th>Jenis</th>
                          <th>Lokasi</th>
                          <th>PA (Pengaju)</th>
                          <th>AA (Penerima)</th>
                          <th>IA (Penerima)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kelompok[tgl].map((p) => (
                          <tr
                            key={p.id}
                            onClick={() => navigate(`/permits/${p.id}`)}
                            className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                          >
                            <td className="py-1.5 font-medium text-slate-700">{p.nomor_izin ?? "-"}</td>
                            <td>{(p.permit_types ?? []).map((t) => t.kode).join(", ") || "-"}</td>
                            <td className="text-slate-600">{p.lokasi ?? "-"}</td>
                            <td>{p.performing_authority?.name ?? "-"}</td>
                            <td>{p.approval_authority?.name ?? "-"}</td>
                            <td>{p.issuing_authority?.name ?? "-"}</td>
                            <td>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusClass(p.status)}`}>
                                {statusLabel(p.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
