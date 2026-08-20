import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getMySummary } from "../services/reportService";
import { statusLabel } from "../lib/status";
import {
  CheckCircle2, Clock, AlertTriangle, FileStack,
  ClipboardCheck, Plus, ArrowRight, Timer,
} from "lucide-react";

const LABEL_PERAN = {
  PA: "Performing Authority", AA: "Approval Authority", IA: "Issuing Authority",
  AGT: "Authorized Gas Tester", SPV: "Supervisor", SHE: "Safety, Health & Environment",
  ADM: "Administrator", PJ: "Petugas Jaga", PW: "Pekerja",
};

// Warna penanda per jenis izin (mengikuti warna lembar cetak).
const WARNA_JENIS = {
  HWP: "#b91c1c", CWP: "#1d4ed8", CSE: "#c2410c", WAH: "#475569",
};

const WARNA_STATUS = {
  aktif: "bg-emerald-100 text-emerald-700",
  selesai: "bg-blue-100 text-blue-700",
  closed: "bg-slate-200 text-slate-600",
  ditolak: "bg-red-100 text-red-700",
  kadaluarsa: "bg-red-100 text-red-700",
  ditunda: "bg-amber-100 text-amber-700",
};
const warnaStatus = (s) => WARNA_STATUS[s] ?? "bg-amber-100 text-amber-700";

/** Kartu metrik utama. */
function KartuMetrik({ ikon: Ikon, warnaIkon, label, nilai, catatan, warnaCatatan, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-brand hover:shadow-sm transition w-full"
    >
      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${warnaIkon}`}>
        <Ikon size={18} />
      </span>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1 leading-none">{nilai}</p>
      {catatan && (
        <p className={`text-xs mt-3 flex items-center gap-1.5 ${warnaCatatan ?? "text-slate-500"}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />{catatan}
        </p>
      )}
    </button>
  );
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMySummary()
      .then((res) => setDash(res.data.dashboard ?? null))
      .catch(() => toast.error("Gagal memuat data dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const peranUtama = user?.roles?.[0];  // /me mengirim daftar kode peran
  const m = dash?.metrik ?? {};
  const distribusi = dash?.distribusi ?? [];
  const totalJenis = distribusi.reduce((a, d) => a + Number(d.jumlah), 0) || 1;
  const mendekati = dash?.mendekati_batas ?? [];
  const terbaru = dash?.terbaru ?? [];

  const sisaWaktu = (tgl) => {
    if (!tgl) return "-";
    const jam = Math.round((new Date(tgl) - new Date()) / 36e5);
    if (jam < 0) return "lewat batas";
    return jam < 24 ? `${jam} jam lagi` : `${Math.round(jam / 24)} hari lagi`;
  };

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      {/* Sapaan + aksi cepat */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Selamat datang, {user?.name}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {LABEL_PERAN[peranUtama] ?? "Pengguna"}
            {m.menunggu > 0 && (
              <> · <span className="text-amber-600 font-medium">{m.menunggu} izin menunggu tindakan</span></>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {hasRole("PA") && (
            <>
              <button onClick={() => navigate("/screening/new")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <ClipboardCheck size={16} /> Penapisan
              </button>
              <button onClick={() => navigate("/permits/new")}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark">
                <Plus size={16} /> Izin Baru
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? <p className="text-sm text-slate-500">Memuat...</p> : (
        <>
          {/* Empat metrik utama */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KartuMetrik ikon={CheckCircle2} warnaIkon="bg-emerald-50 text-emerald-600"
              label="Izin Aktif" nilai={m.aktif ?? 0}
              catatan="Pekerjaan sedang berlangsung" warnaCatatan="text-emerald-600"
              onClick={() => navigate("/permits?status=aktif")} />
            <KartuMetrik ikon={Clock} warnaIkon="bg-amber-50 text-amber-600"
              label="Menunggu Tindakan" nilai={m.menunggu ?? 0}
              catatan={m.menunggu > 0 ? "Perlu ditindaklanjuti" : "Tidak ada antrean"}
              warnaCatatan={m.menunggu > 0 ? "text-amber-600" : "text-slate-500"}
              onClick={() => navigate("/permits")} />
            <KartuMetrik ikon={AlertTriangle} warnaIkon="bg-red-50 text-red-600"
              label="Mendekati Batas Waktu" nilai={m.mendekati_batas ?? 0}
              catatan="Berakhir dalam 12 jam"
              warnaCatatan={m.mendekati_batas > 0 ? "text-red-600" : "text-slate-500"}
              onClick={() => navigate("/permits?status=aktif")} />
            <KartuMetrik ikon={FileStack} warnaIkon="bg-blue-50 text-blue-600"
              label="Total Izin" nilai={m.total ?? 0}
              catatan={`${m.bulan_ini ?? 0} diajukan bulan ini`}
              onClick={() => navigate("/permits")} />
          </div>

          {/* Izin terbaru + panel kanan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {/* Tabel izin terbaru */}
            <div className="lg:col-span-2 min-w-0 bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                <div>
                  <h2 className="font-semibold text-slate-800">Izin Terbaru</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Lima izin terakhir yang berkaitan dengan Anda</p>
                </div>
                <button onClick={() => navigate("/permits")}
                  className="text-sm text-brand font-medium hover:underline flex items-center gap-1">
                  Lihat semua <ArrowRight size={14} />
                </button>
              </div>
              {terbaru.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-10">Belum ada izin.</p>
              ) : (
                <div className="overflow-x-auto"><table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 bg-slate-50">
                      <th className="px-4 py-2.5 font-semibold">Nomor Izin</th>
                      <th className="py-2.5 font-semibold">Jenis</th>
                      <th className="py-2.5 font-semibold">Lokasi</th>
                      <th className="py-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terbaru.map((p) => (
                      <tr key={p.id} onClick={() => navigate(`/permits/${p.id}`)}
                        className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <td className="px-4 py-2.5 font-medium text-slate-700">{p.nomor_izin ?? "-"}</td>
                        <td className="py-2.5">
                          <div className="flex gap-1">
                            {(p.permit_types ?? []).map((t) => (
                              <span key={t.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                                style={{ background: WARNA_JENIS[t.kode] ?? "#64748b" }}>{t.kode}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-600">{p.lokasi ?? "-"}</td>
                        <td className="py-2.5">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${warnaStatus(p.status)}`}>
                            {statusLabel(p.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              )}
            </div>

            {/* Panel kanan */}
            <div className="min-w-0 space-y-4">
              {/* Distribusi jenis izin */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-semibold text-slate-800">Distribusi Jenis Izin</h2>
                <p className="text-xs text-slate-400 mt-0.5 mb-4">Dari seluruh izin Anda</p>
                {distribusi.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">Belum ada data.</p>
                ) : distribusi.map((d) => {
                  const persen = Math.round((Number(d.jumlah) / totalJenis) * 100);
                  return (
                    <div key={d.kode} className="mb-3 last:mb-0">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-600"><b className="text-slate-800">{d.kode}</b> — {d.nama}</span>
                        <span className="font-semibold text-slate-700">{d.jumlah}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{ width: `${persen}%`, background: WARNA_JENIS[d.kode] ?? "#64748b" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mendekati batas waktu */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <Timer size={16} className="text-red-500" />
                  <h2 className="font-semibold text-slate-800">Mendekati Batas Waktu</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 mb-3">Izin aktif dengan masa berlaku terdekat</p>
                {mendekati.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">Tidak ada izin aktif.</p>
                ) : mendekati.map((p) => (
                  <button key={p.id} onClick={() => navigate(`/permits/${p.id}`)}
                    className="w-full text-left flex items-center justify-between py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded px-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{p.nomor_izin ?? "-"}</p>
                      <p className="text-xs text-slate-400 truncate">{p.lokasi ?? "-"}</p>
                    </div>
                    <span className="text-xs font-semibold text-red-600 whitespace-nowrap ml-2">
                      {sisaWaktu(p.tgl_kadaluarsa)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
