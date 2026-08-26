import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { getNotifications } from "../services/notificationService";

const NotificationContext = createContext(null);

// Refresh berkala supaya badge di header & sidebar tetap akurat tanpa
// menunggu user membuka halaman /notifications.
const INTERVAL_MS = 30000;

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Ambil ulang jumlah belum dibaca dari server. Dipakai saat mount, tiap
  // interval, dan dipanggil manual oleh NotificationsPage setelah menandai
  // sebuah notifikasi sebagai dibaca (supaya badge langsung ikut berubah).
  const refresh = useCallback(() => {
    if (!isAuthenticated) return;
    getNotifications()
      .then((res) => setUnreadCount(res.data.unread_count ?? 0))
      .catch(() => {
        // Abaikan error jaringan sesaat — badge tetap menampilkan nilai lama.
      });
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    refresh();
    const id = setInterval(refresh, INTERVAL_MS);
    return () => clearInterval(id);
  }, [isAuthenticated, refresh]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook pemakaian: const { unreadCount, refresh } = useNotifications();
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications harus dipakai di dalam <NotificationProvider>");
  return ctx;
}
