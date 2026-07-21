import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserCircle2, Mail, Briefcase, ShieldCheck, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  // roles bisa berupa array string ("PA") atau array objek ({kode_role, nama_role}).
  // Tangani keduanya agar aman apa pun bentuk dari backend.
  const roleList = (user?.roles ?? []).map((r) =>
    typeof r === "string" ? r : (r.nama_role || r.kode_role)
  );

  const baris = [
    { icon: Mail, label: "Email", value: user?.email },
    { icon: Briefcase, label: "Jabatan", value: user?.jabatan || "—" },
  ];

  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-xl font-bold text-slate-800 mb-4">Profil Saya</h1>

        <div className="bg-white rounded-xl shadow p-6">
          {/* Identitas */}
          <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
            <UserCircle2 size={56} className="text-emerald-600" />
            <div className="min-w-0">
              <p className="text-lg font-semibold text-slate-800 truncate">{user?.name ?? "Pengguna"}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {roleList.length ? roleList.map((r, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    <ShieldCheck size={12} /> {r}
                  </span>
                )) : <span className="text-xs text-slate-400">Tanpa peran</span>}
              </div>
            </div>
          </div>

          {/* Detail */}
          <dl className="divide-y divide-slate-100">
            {baris.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 py-3">
                <Icon size={18} className="text-slate-400 shrink-0" />
                <dt className="w-24 text-sm text-slate-500">{label}</dt>
                <dd className="flex-1 text-sm text-slate-800 break-all">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Aksi */}
          <button
            onClick={doLogout}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} /> Keluar dari Akun
          </button>

          <p className="mt-3 text-center text-[11px] text-slate-400">
            Ubah data profil belum tersedia. Hubungi Administrator untuk perubahan.
          </p>
        </div>
      </div>
    </div>
  );
}
