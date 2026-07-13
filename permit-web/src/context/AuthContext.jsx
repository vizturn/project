import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginRequest, logoutRequest, meRequest } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true saat cek token awal

  // Saat aplikasi dimuat / refresh: kalau ada token, ambil profil user.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    meRequest()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await loginRequest(email, password);
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // abaikan error jaringan saat logout
    }
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  // Samakan dengan middleware backend role:KODE (kode_role: PA/AA/IA/AGT/PJ/SHE/ADM)
  const hasRole = useCallback(
    (...kodeRole) => {
      if (!user?.roles) return false;
      return kodeRole.some((k) => user.roles.includes(k));
    },
    [user]
  );

  const value = { user, loading, login, logout, hasRole, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook pemakaian: const { user, login } = useAuth();
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam <AuthProvider>");
  return ctx;
}
