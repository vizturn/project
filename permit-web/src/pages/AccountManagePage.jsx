import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccounts, deactivateAccount, reactivateAccount, deleteAccount } from "../services/accountService";
import Button from "../components/Button";
import ConfirmDialog from "../components/ConfirmDialog";
import { toast } from "sonner";
import { Users, ArrowLeft, Ban, Trash2, CheckCircle2 } from "lucide-react";

/**
 * Halaman ICT/ADM untuk mengelola akun yang sudah ada:
 *   - Nonaktifkan  : akun tidak bisa login, data tetap tersimpan (audit).
 *   - Hapus permanen: dihapus dari sistem (ditolak backend bila punya izin terkait).
 */
export default function AccountManagePage() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [dialog, setDialog] = useState(null); // { tipe: "nonaktif"|"hapus", user }

  const load = useCallback(() => {
    setLoading(true);
    getAccounts()
      .then((res) => setList(res.data.data))
      .catch(() => toast.error("Gagal memuat daftar akun."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const jalankan = async () => {
    if (!dialog) return;
    const { tipe, user } = dialog;
    setBusyId(user.id);
    try {
      if (tipe === "nonaktif") {
        const res = await deactivateAccount(user.id);
        toast.success(res.data.message || "Akun dinonaktifkan.");
      } else if (tipe === "reaktif") {
        const res = await reactivateAccount(user.id);
        toast.success(res.data.message || "Akun diaktifkan kembali.");
      } else {
        const res = await deleteAccount(user.id);
        toast.success(res.data.message || "Akun dihapus.");
      }
      setDialog(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Aksi gagal.");
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
            <Users className="text-brand" size={22} />
            <h1 className="text-lg font-bold text-slate-800">Kelola Akun</h1>
          </div>

          {loading ? (
            <p className="text-slate-500 text-sm">Memuat...</p>
          ) : list.length === 0 ? (
            <p className="text-slate-500 text-sm">Belum ada akun.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2">Nama</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="py-2 font-medium text-slate-700">{u.name}</td>
                    <td className="py-2 text-slate-500">{u.email}</td>
                    <td className="py-2">{u.roles?.length ? u.roles.join(", ") : "—"}</td>
                    <td className="py-2">
                      {u.status_aktif ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                          <CheckCircle2 size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                          <Ban size={12} /> Non-aktif
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2 justify-end">
                        {u.status_aktif ? (
                          <Button variant="outline" onClick={() => setDialog({ tipe: "nonaktif", user: u })} busy={busyId === u.id}>
                            <Ban size={15} /> Nonaktifkan
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => setDialog({ tipe: "reaktif", user: u })} busy={busyId === u.id}>
                            <CheckCircle2 size={15} /> Aktifkan kembali
                          </Button>
                        )}
                        <Button variant="danger" onClick={() => setDialog({ tipe: "hapus", user: u })} busy={busyId === u.id}>
                          <Trash2 size={15} /> Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!dialog}
        title={
          dialog?.tipe === "nonaktif" ? "Nonaktifkan Akun"
          : dialog?.tipe === "reaktif" ? "Aktifkan Kembali Akun"
          : "Hapus Akun Permanen"
        }
        message={dialog && (
          dialog.tipe === "nonaktif" ? (
            <>Nonaktifkan akun <span className="font-medium">{dialog.user.name}</span>? Pengguna tidak dapat login sampai diaktifkan kembali.</>
          ) : dialog.tipe === "reaktif" ? (
            <>Aktifkan kembali akun <span className="font-medium">{dialog.user.name}</span>? Pengguna dapat login lagi dengan role sebelumnya.</>
          ) : (
            <>Hapus permanen akun <span className="font-medium">{dialog.user.name}</span>? Tindakan ini tidak dapat dibatalkan. Akun dengan izin terkait tidak dapat dihapus.</>
          )
        )}
        confirmLabel={
          dialog?.tipe === "nonaktif" ? "Nonaktifkan"
          : dialog?.tipe === "reaktif" ? "Aktifkan kembali"
          : "Hapus Permanen"
        }
        variant={dialog?.tipe === "reaktif" ? "primary" : "danger"}
        busy={busyId === dialog?.user?.id}
        onConfirm={jalankan}
        onCancel={() => setDialog(null)}
      />
    </div>
  );
}
