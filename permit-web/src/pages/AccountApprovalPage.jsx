import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccounts, activateAccount, rejectAccount } from "../services/accountService";
import Button from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import { toast } from "sonner";
import { UserCheck, ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react";

// Role yang dapat ditetapkan SHE saat mengaktifkan akun.
const ROLE_OPTIONS = ["PA", "AA", "IA", "AGT", "PJ", "PW", "SPV", "SHE", "ADM"];

export default function AccountApprovalPage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending"); // pending | aktif
  const [pilihRole, setPilihRole] = useState({}); // { userId: role }
  const [busyId, setBusyId] = useState(null);
  const [tolakTarget, setTolakTarget] = useState(null); // akun yang akan ditolak (untuk dialog)

  const load = useCallback(() => {
    setLoading(true);
    getAccounts(tab)
      .then((res) => setList(res.data.data))
      .catch(() => toast.error("Gagal memuat daftar akun."))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const aktifkan = async (u) => {
    const role = pilihRole[u.id] || u.role_diminta || "PA";
    setBusyId(u.id);
    try {
      const res = await activateAccount(u.id, role);
      toast.success(res.data.message || "Akun diaktifkan.");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengaktifkan akun.");
    } finally {
      setBusyId(null);
    }
  };

  // Klik "Tolak" -> buka dialog konfirmasi (bukan langsung hapus).
  const konfirmasiTolak = async () => {
    const u = tolakTarget;
    if (!u) return;
    setBusyId(u.id);
    try {
      const res = await rejectAccount(u.id);
      toast.success(res.data.message || "Pendaftaran ditolak.");
      setTolakTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menolak pendaftaran.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={16} /> Dashboard
        </button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="text-brand" size={22} />
            <h1 className="text-lg font-bold text-slate-800">Persetujuan Akun</h1>
          </div>

          {/* Tab pending / aktif */}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setTab("pending")}
              className={"flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border " +
                (tab === "pending" ? "bg-brand-50 border-brand-light text-brand" : "bg-white border-slate-200 text-slate-600")}>
              <Clock size={15} /> Menunggu Persetujuan
            </button>
            <button onClick={() => setTab("aktif")}
              className={"flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border " +
                (tab === "aktif" ? "bg-brand-50 border-brand-light text-brand" : "bg-white border-slate-200 text-slate-600")}>
              <CheckCircle2 size={15} /> Akun Aktif
            </button>
          </div>

          {loading ? (
            <p className="text-slate-500 text-sm">Memuat...</p>
          ) : list.length === 0 ? (
            <p className="text-slate-500 text-sm">
              {tab === "pending" ? "Tidak ada akun yang menunggu persetujuan." : "Belum ada akun aktif."}
            </p>
          ) : (
            <div className="space-y-3">
              {list.map((u) => (
                <div key={u.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800">{u.name}</div>
                      <div className="text-sm text-slate-500">{u.email}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {[u.jabatan, u.divisi, u.perusahaan].filter(Boolean).join(" · ") || "—"}
                      </div>
                      <div className="text-xs mt-1">
                        <span className="text-slate-400">Role diminta: </span>
                        <span className="font-medium text-slate-600">{u.role_diminta || "—"}</span>
                        {u.roles?.length > 0 && (
                          <span className="ml-2 text-slate-400">Role saat ini: <span className="font-medium text-slate-600">{u.roles.join(", ")}</span></span>
                        )}
                      </div>
                    </div>

                    {tab === "pending" && (
                      <div className="flex items-center gap-2">
                        <select
                          value={pilihRole[u.id] ?? (u.role_diminta || "PA")}
                          onChange={(e) => setPilihRole((p) => ({ ...p, [u.id]: e.target.value }))}
                          className="px-2.5 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                        >
                          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <Button onClick={() => aktifkan(u)} busy={busyId === u.id}>
                          <CheckCircle2 size={16} /> Aktifkan
                        </Button>
                        <Button variant="danger" onClick={() => setTolakTarget(u)} busy={busyId === u.id}>
                          <XCircle size={16} /> Tolak
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!tolakTarget}
        title="Tolak Pendaftaran"
        message={tolakTarget && (
          <>Tolak & hapus pendaftaran <span className="font-medium">{tolakTarget.name}</span> ({tolakTarget.email})? Tindakan ini tidak dapat dibatalkan.</>
        )}
        confirmLabel="Tolak"
        cancelLabel="Batal"
        variant="danger"
        busy={busyId === tolakTarget?.id}
        onConfirm={konfirmasiTolak}
        onCancel={() => setTolakTarget(null)}
      />
    </div>
  );
}
