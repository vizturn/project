import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Blokir akses jika belum login. Saat masih cek token, tampilkan loader.
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Memuat...
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
