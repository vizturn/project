import { useState } from "react";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import { registerRequest } from "../services/authService";
import { toast } from "sonner";
import { ShieldCheck, Eye, EyeOff, ArrowLeft } from "lucide-react";

// Role yang boleh diminta saat mendaftar (umumnya PA; lainnya jarang mendaftar mandiri).
const ROLE_OPTIONS = [
  { kode: "PA", label: "Performing Authority (PA)" },
  { kode: "AA", label: "Approval Authority (AA)" },
  { kode: "IA", label: "Issuing Authority (IA)" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", password_confirmation: "",
    role_diminta: "PA", jabatan: "", divisi: "", perusahaan: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Nama, email, dan password wajib diisi.");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password minimal 8 karakter.");
      return;
    }
    if (form.password !== form.password_confirmation) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      const res = await registerRequest(form);
      toast.success(res.data.message || "Pendaftaran berhasil.");
      navigate("/login");
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.errors
        ? Object.values(data.errors)[0][0]
        : data?.message || "Pendaftaran gagal. Periksa koneksi.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-100">
      {/* Panel kiri - branding */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden bg-cover"
        style={{ backgroundImage: "url('/login-bg.jpg')", backgroundPosition: "center 68%" }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 flex items-center gap-3">
          <img src="/emp-logo.png" alt="EMP" className="h-9 w-auto block" />
          <span className="font-semibold tracking-wide leading-tight">
            Bentu Limited
            <span className="block text-sm font-normal text-white/80">Korinci Baru</span>
          </span>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight mb-4">Daftar Akun<br />Digital Permit</h1>
          <p className="text-white/90 text-base leading-relaxed max-w-md">
            Ajukan akun untuk mengakses sistem izin kerja. Akun akan ditinjau dan
            diaktifkan oleh Departemen SHE sebelum dapat digunakan.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-white/85 text-sm">
          <ShieldCheck size={18} />
          <span>Safety, Health &amp; Environment</span>
        </div>
      </div>

      {/* Panel kanan - form register */}
      <div className="flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-sm py-6">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6"
          >
            <ArrowLeft size={16} /> Kembali ke Masuk
          </button>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Buat akun baru</h2>
          <p className="text-slate-500 text-sm mb-6">
            Lengkapi data berikut. Akun aktif setelah disetujui SHE.
          </p>

          <div className="space-y-3">
            <Field label="Nama Lengkap *" value={form.name} onChange={set("name")} placeholder="Nama Anda" />
            <Field label="Email Kerja *" type="email" value={form.email} onChange={set("email")} placeholder="nama@perusahaan.com" />

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Password *</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  className="w-full px-3.5 py-2.5 pr-11 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
                  placeholder="Minimal 8 karakter"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Field label="Konfirmasi Password *" type="password" value={form.password_confirmation} onChange={set("password_confirmation")} placeholder="Ulangi password" />

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Role yang Diminta *</label>
              <select
                value={form.role_diminta}
                onChange={set("role_diminta")}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition bg-white"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.kode} value={r.kode}>{r.label}</option>
                ))}
              </select>
            </div>

            <Field label="Jabatan" value={form.jabatan} onChange={set("jabatan")} placeholder="mis. Teknisi" />
            <Field label="Divisi" value={form.divisi} onChange={set("divisi")} placeholder="mis. Operasi" />
            <Field label="Nama Perusahaan" value={form.perusahaan} onChange={set("perusahaan")} placeholder="mis. EMP Bentu Limited" />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full mt-6">
            {loading ? "Mendaftar..." : "Daftar"}
          </Button>

          <p className="text-center text-sm text-slate-500 mt-4">
            Sudah punya akun?{" "}
            <button onClick={() => navigate("/login")} className="text-brand font-medium hover:underline">
              Masuk di sini
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Field teks sederhana yang konsisten dengan gaya form.
function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
        placeholder={placeholder}
      />
    </div>
  );
}
