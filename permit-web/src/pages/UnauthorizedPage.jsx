import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-100 text-center p-4">
      <ShieldAlert className="text-red-500" size={40} />
      <h1 className="text-xl font-bold text-slate-800">403 — Akses ditolak</h1>
      <p className="text-slate-600">Peran akun Anda tidak diizinkan membuka halaman ini.</p>
      <Link to="/dashboard" className="text-emerald-600 hover:underline">
        Kembali ke dashboard
      </Link>
    </div>
  );
}
