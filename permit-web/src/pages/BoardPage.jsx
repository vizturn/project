import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPermits } from "../services/permitService";
import { toast } from "sonner";
import { LayoutGrid, RefreshCw, ArrowLeft, Clock, PauseCircle, Lock } from "lucide-react";

// Kolom papan beserta identitas visualnya.
const KOLOM = [
  { key: "aktif",  judul: "Aktif",  ikon: Clock,        aksen: "bg-emerald-500", teks: "text-emerald-700", latar: "bg-emerald-50/60", ket: "Pekerjaan sedang berlangsung" },
  { key: "ditunda", judul: "Ditunda", ikon: PauseCircle, aksen: "bg-amber-500",   teks: "text-amber-700",   latar: "bg-amber-50/60",   ket: "Menunggu revalidasi" },
  { key: "closed",  judul: "Closed",  ikon: Lock,        aksen: "bg-slate-400",   teks: "text-slate-600",   latar: "bg-slate-50",      ket: "Izin telah ditutup" },
];

// Warna penanda jenis izin (seragam dengan halaman lain).
const WARNA_JENIS = { HWP: "#b91c1c", CWP: "#1d4ed8", CSE: "#c2410c", WAH: "#475569" };

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

  const jenisIzin = (p) =>
    p.permit_types?.length ? p.permit_types : p.permit_type ? [p.permit_type] : [];

  // Sisa waktu sampai batas berlaku, untuk izin yang masih aktif.
  const sisaWaktu = (tgl) => {
    if (!tgl) return null;
    const jam = Math.round((new Date(tgl) - new Date()) / 36e5);
    if (jam < 0) return { teks: "lewat batas", kritis: true };
    if (jam < 12) return { teks: `${jam} jam lagi`, kritis: true };
    return { teks: jam < 24 ? `${jam} jam lagi` : `${Math.round(jam / 24)} hari lagi`, kritis: false };
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-[1240px] mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3">
          <ArrowLeft size={15} /> Dashboard
        </button>

        {/* Kepala halaman */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 text-brand">
              <LayoutGrid size={20} />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Papan Izin Digital</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {loading ? "Memuat..." : `${byStatus("aktif").length} izin aktif · ${byStatus("ditunda").length} ditunda`}
              </p>
            </div>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm font-medium text-slate-600 hover:bg-slate-50">
            <RefreshCw size={15} /> Segarkan
          </button>
        </div>

        {loading ? (
          <p className="text-slate-500 text-sm">Memuat...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            {KOLOM.map((k) => {
              const isi = byStatus(k.key);
              const Ikon = k.ikon;
              return (
                <div key={k.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Kepala kolom */}
                  <div className={`${k.latar} px-4 py-3 border-b border-slate-200`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${k.aksen}`} />
                        <h2 className={`font-bold ${k.teks}`}>{k.judul}</h2>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                        {isi.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{k.ket}</p>
                  </div>

                  {/* Isi kolom */}
                  <div className="p-3 space-y-2 min-h-[120px]">
                    {isi.length === 0 ? (
                      <div className="text-center py-8">
                        <Ikon size={26} className="mx-auto text-slate-200" />
                        <p className="text-xs text-slate-400 mt-2">Tidak ada izin</p>
                      </div>
                    ) : (
                      isi.map((p) => {
                        const sisa = k.key === "aktif" ? sisaWaktu(p.tgl_kadaluarsa) : null;
                        return (
                          <button key={p.id} onClick={() => navigate(`/permits/${p.id}`)}
                            className="w-full text-left border border-slate-200 rounded-lg p-3 hover:border-brand hover:bg-slate-50 transition">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-sm text-slate-700 truncate">{p.nomor_izin}</span>
                              <div className="flex gap-1 shrink-0">
                                {jenisIzin(p).map((t) => (
                                  <span key={t.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                                    style={{ background: WARNA_JENIS[t.kode] ?? "#64748b" }}>
                                    {t.kode}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 truncate">{p.lokasi || "-"}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-slate-400 truncate">
                                {p.performing_authority?.name ?? "-"}
                              </span>
                              {sisa && (
                                <span className={`text-xs font-semibold shrink-0 ml-2 ${sisa.kritis ? "text-red-600" : "text-slate-500"}`}>
                                  {sisa.teks}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
