import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";

// Tombol lonceng notifikasi untuk header atas. Menampilkan badge jumlah
// belum dibaca (mengikuti unread_count dari NotificationContext), dan saat
// ditekan langsung masuk ke halaman /notifications.
export default function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  return (
    <button
      type="button"
      onClick={() => navigate("/notifications")}
      aria-label={unreadCount > 0 ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi"}
      className="relative w-10 h-10 flex items-center justify-center rounded-lg bg-brand-50 text-brand border border-brand-light hover:bg-brand-light/40 transition-colors"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
