import { useState } from "react";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      toast.error("Email dan password wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Login berhasil.");
      navigate("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || "Login gagal. Periksa koneksi.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-100">
      {/* Panel kiri - branding dengan gambar latar + overlay gelap */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden bg-cover"
        style={{ backgroundImage: "url('/login-bg.jpg')", backgroundPosition: "center 68%" }}
      >
        {/* overlay gelap agar teks tetap terbaca */}
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 flex items-center gap-3">
          <img src="/emp-logo.png" alt="EMP" className="h-9 w-auto block" />
          <span className="font-semibold tracking-wide leading-none -mt-1">Bentu Limited</span>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Digital Permit<br />to Work
          </h1>
          <p className="text-white/90 text-base leading-relaxed max-w-md">
            Sistem digitalisasi izin kerja untuk operasi migas - pengajuan,
            persetujuan, dan pemantauan permit dalam satu alur yang aman dan
            tertelusur.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-white/85 text-sm">
          <ShieldCheck size={18} />
          <span>Safety, Health &amp; Environment</span>
        </div>
      </div>

      {/* Panel kanan - form login */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <ShieldCheck className="text-brand" size={24} />
            <span className="font-bold text-slate-800 text-lg">Digital Permit SHE</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Selamat datang</h2>
          <p className="text-slate-500 text-sm mb-8">
            Masuk dengan akun kerja Anda untuk mengakses sistem.
          </p>

          <label className="block text-sm font-medium text-slate-600 mb-1.5">Email Kerja</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-3.5 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
            placeholder="nama@perusahaan.com"
          />

          <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
          <div className="relative mb-6">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-3.5 py-2.5 pr-11 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition"
              placeholder="Masukkan password"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPass ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Masuk..." : "Masuk"}
          </Button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-brand font-medium hover:underline"
            >
              Daftar akun baru
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
