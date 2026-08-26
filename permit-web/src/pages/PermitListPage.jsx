import { useCallback, useEffect, useState } from "react";
import Button from "../components/Button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPermits } from "../services/permitService";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import RoleResponsibilityNotice from "../components/RoleResponsibilityNotice";
import { statusLabel } from "../lib/status";
import { toast } from "sonner";
import { FileText, Plus, ArrowLeft, Inbox, X, Search, FileX2 } from "lucide-react";

// Status yang tergolong "menunggu" (untuk filter gabungan Pending Review).
const STATUS_MENUNGGU = [
  "menunggu_approval",
  "menunggu_persiapan_pa",
  "menunggu_penerbitan",
  "menunggu_penerimaan",
  "ditunda",
];

// Warna penanda jenis izin (seragam dengan dashboard dan lembar cetak).
const WARNA_JENIS = { HWP: "#b91c1c", CWP: "#1d4ed8", CSE: "#c2410c", WAH: "#475569" };

// Penyaring cepat berdasarkan status (memakai parameter URL yang sudah ada).
const FILTER_CEPAT = [
  { nilai: null, label: "Semua" },
  { nilai: "menunggu", label: "Menunggu" },
  { nilai: "aktif", label: "Aktif" },
  { nilai: "selesai", label: "Selesai" },
  { nilai: "closed", label: "Closed" },
];

export default function PermitListPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cari, setCari] = useState("");

  // Gerbang Tugas & Tanggung Jawab: PA/AA/IA melihat layar ini dulu setiap
  // kali membuka menu Daftar Izin, baru lanjut ke tabel daftar izin.
  // Peran lain (AGT, PJ, SPV, SHE, ADM) langsung ke tabel seperti biasa.
  const wajibKonfirmasiTugas = hasRole("PA", "AA", "IA");
  const [tugasDikonfirmasi, setTugasDikonfirmasi] = useState(false);
  // scope dari URL: "all" = semua izin (drill-down statistik global SHE/ADM),
  // selain itu default inbox (hanya yang relevan bagi pengguna).
  const [inbox, setInbox] = useState(params.get("scope") !== "all");

  // Filter status dari URL. Nilai khusus "menunggu" = gabungan semua status menunggu.
  const filterStatus = params.get("status");

  const load = useCallback(() => {
    setLoading(true);
    getPermits(inbox ? "inbox" : undefined)
      .then((res) => setList(res.data.data))
      .catch(() => toast.error("Gagal memuat daftar izin."))
      .finally(() => setLoading(false));
  }, [inbox]);

  useEffect(() => { load(); }, [load]);

  // Saring daftar sesuai filter status (dilakukan di frontend).
  const terfilter = !filterStatus
    ? list
    : filterStatus === "menunggu"
      ? list.filter((p) => STATUS_MENUNGGU.includes(p.status))
      : list.filter((p) => p.status === filterStatus);

  // Pencarian pada nomor izin, lokasi, dan nama pengaju.
  const kunci = cari.trim().toLowerCase();
  const daftar = !kunci
    ? terfilter
    : terfilter.filter((p) =>
        [p.nomor_izin, p.lokasi, p.performing_authority?.name]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(kunci))
      );

  const labelFilter =
    filterStatus === "menunggu" ? "Menunggu (Pending Review)"
    : filterStatus ? statusLabel(filterStatus)
    : null;

  const setFilter = (nilai) => {
    const next = new URLSearchParams(params);
    if (nilai) next.set("status", nilai); else next.delete("status");
    setParams(next);
  };
  const hapusFilter = () => setFilter(null);

  const fmtTgl = (d) => (d ? new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-");

  // Gerbang Tugas & Tanggung Jawab — tampil duluan untuk PA/AA/IA, sebelum tabel izin.
  if (wajibKonfirmasiTugas && !tugasDikonfirmasi) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-4">
            <ArrowLeft size={15} /> Dashboard
          </button>
          <RoleResponsibilityNotice onLanjut={() => setTugasDikonfirmasi(true)} />
        </div>
      </div>
    );
  }

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
              <FileText size={20} />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Daftar Izin Kerja</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {loading ? "Memuat..." : `${daftar.length} izin ditampilkan`}
                {inbox && " · ditujukan kepada Anda"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setInbox((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                inbox ? "bg-brand-50 border-brand-light text-brand" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}>
              <Inbox size={16} /> {inbox ? "Untuk Saya" : "Semua Izin"}
            </button>
            {hasRole("PA") && (
              <Button onClick={() => navigate("/screening/new")}><Plus size={16} /> Pengajuan Baru</Button>
            )}
          </div>
        </div>

        {/* Penyaring cepat + pencarian */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap gap-1.5">
            {FILTER_CEPAT.map((f) => {
              const aktif = (f.nilai ?? null) === (filterStatus ?? null);
              return (
                <button key={f.label} onClick={() => setFilter(f.nilai)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                    aktif ? "bg-brand text-white border-brand" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}>
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Cari nomor izin, lokasi, atau pengaju"
              className="w-72 pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Penanda filter aktif di luar daftar cepat */}
        {labelFilter && !FILTER_CEPAT.some((f) => f.nilai === filterStatus) && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-slate-500">Difilter:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 text-brand text-sm font-medium">
              {labelFilter}
              <button onClick={hapusFilter} className="hover:text-brand-dark" aria-label="Hapus filter">
                <X size={14} />
              </button>
            </span>
          </div>
        )}

        {/* Daftar izin */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <p className="text-slate-500 text-sm p-6">Memuat...</p>
          ) : daftar.length === 0 ? (
            <div className="text-center py-16 px-6">
              <FileX2 size={36} className="mx-auto text-slate-300" />
              <p className="text-slate-600 font-medium mt-3">
                {kunci ? "Tidak ada izin yang cocok" : filterStatus ? "Tidak ada izin dengan status ini" : inbox ? "Tidak ada izin yang ditujukan kepada Anda" : "Belum ada izin kerja"}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {kunci ? "Coba kata kunci lain atau hapus pencarian." : inbox ? "Coba tampilkan Semua Izin." : "Izin yang dibuat akan tampil di sini."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="text-left text-xs text-slate-500 bg-slate-50">
                    <th className="px-5 py-3 font-semibold">Nomor Izin</th>
                    <th className="py-3 font-semibold">Jenis</th>
                    <th className="py-3 font-semibold">Lokasi</th>
                    <th className="py-3 font-semibold">Pengaju</th>
                    <th className="py-3 font-semibold">AA / IA</th>
                    <th className="py-3 font-semibold">Tanggal</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {daftar.map((p) => (
                    <tr key={p.id} onClick={() => navigate(`/permits/${p.id}`)}
                      className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <td className="px-5 py-3 font-medium text-slate-700 whitespace-nowrap">{p.nomor_izin}</td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          {(p.permit_types?.length ? p.permit_types : p.permit_type ? [p.permit_type] : []).map((t) => (
                            <span key={t.id} className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                              style={{ background: WARNA_JENIS[t.kode] ?? "#64748b" }}>
                              {t.kode}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 text-slate-600">{p.lokasi || "-"}</td>
                      <td className="py-3 text-slate-600">{p.performing_authority?.name ?? "-"}</td>
                      <td className="py-3 text-xs text-slate-400">
                        {p.approval_authority?.name ?? "-"} / {p.issuing_authority?.name ?? "-"}
                      </td>
                      <td className="py-3 text-slate-500 whitespace-nowrap">{fmtTgl(p.created_at)}</td>
                      <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
