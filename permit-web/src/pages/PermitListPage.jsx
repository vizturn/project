import { useCallback, useEffect, useState } from "react";
import Button from "../components/Button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPermits } from "../services/permitService";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import { statusLabel } from "../lib/status";
import { toast } from "sonner";
import { FileText, Plus, ArrowLeft, Inbox, X } from "lucide-react";

// Status yang tergolong "menunggu" (untuk filter gabungan Pending Review).
const STATUS_MENUNGGU = [
  "menunggu_approval",
  "menunggu_persiapan_pa",
  "menunggu_penerbitan",
  "menunggu_penerimaan",
  "ditunda",
];

export default function PermitListPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
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
  const daftar = !filterStatus
    ? list
    : filterStatus === "menunggu"
      ? list.filter((p) => STATUS_MENUNGGU.includes(p.status))
      : list.filter((p) => p.status === filterStatus);

  const labelFilter =
    filterStatus === "menunggu" ? "Menunggu (Pending Review)"
    : filterStatus ? statusLabel(filterStatus)
    : null;

  const hapusFilter = () => {
    const next = new URLSearchParams(params);
    next.delete("status");
    setParams(next);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={16} /> Dashboard
        </button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="text-brand" size={22} />
              <h1 className="text-lg font-bold text-slate-800">Daftar Izin Kerja</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setInbox((v) => !v)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm border ${inbox ? "bg-brand-50 border-brand-light text-brand" : "bg-white border-slate-200 text-slate-600"}`}>
                <Inbox size={16} /> {inbox ? "Untuk Saya" : "Semua Izin"}
              </button>
              {hasRole("PA") && (
                <Button onClick={() => navigate("/permits/new")}><Plus size={16} /> Pengajuan Baru</Button>
              )}
            </div>
          </div>

          {/* Chip filter status aktif */}
          {labelFilter && (
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

          {loading ? (
            <p className="text-slate-500 text-sm">Memuat...</p>
          ) : daftar.length === 0 ? (
            <p className="text-slate-500 text-sm">
              {filterStatus ? "Tidak ada izin dengan status ini." : inbox ? "Tidak ada izin yang ditujukan kepada Anda." : "Belum ada izin kerja."}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Nomor Izin</th>
                  <th className="py-2">Jenis</th>
                  <th className="py-2">Lokasi</th>
                  <th className="py-2">PA</th>
                  <th className="py-2">AA / IA</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {daftar.map((p) => (
                  <tr key={p.id} onClick={() => navigate(`/permits/${p.id}`)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                    <td className="py-2 font-medium text-slate-700">{p.nomor_izin}</td>
                    <td className="py-2">
                      {(p.permit_types?.length ? p.permit_types : p.permit_type ? [p.permit_type] : []).map((t) => (
                        <span key={t.id} className="inline-block mr-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                          {t.kode}
                        </span>
                      ))}
                    </td>
                    <td className="py-2">{p.lokasi}</td>
                    <td className="py-2">{p.performing_authority?.name ?? "-"}</td>
                    <td className="py-2 text-xs text-slate-500">
                      {p.approval_authority?.name ?? "-"} / {p.issuing_authority?.name ?? "-"}
                    </td>
                    <td className="py-2"><StatusBadge status={p.status} /></td>
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
