import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markNotificationRead } from "../services/notificationService";
import { useNotifications } from "../context/NotificationContext";
import { toast } from "sonner";
import {
  Bell, ArrowLeft, FileCheck2, Send, FlaskConical, XCircle,
  RefreshCw, AlertTriangle, DoorOpen, ArrowUpDown, Inbox,
} from "lucide-react";

/**
 * Kategori notifikasi disimpulkan dari kata kunci pada teks pesan (backend
 * tidak menyimpan kategori/tipe terpisah — hanya teks bebas), lalu dipetakan
 * ke ikon + warna. Urutan penting: kata kunci lebih spesifik dicek lebih dulu.
 * Palet warna sengaja disamakan dengan lib/status.js agar konsisten dengan
 * warna status di seluruh aplikasi (mis. "aktif" = emerald, "ditolak" = merah).
 */
const KATEGORI = [
  { tes: /ditolak/i, label: "Ditolak", icon: XCircle, dot: "bg-red-500", chip: "bg-red-100 text-red-700" },
  { tes: /kadaluarsa/i, label: "Kadaluarsa", icon: AlertTriangle, dot: "bg-orange-500", chip: "bg-orange-100 text-orange-700" },
  { tes: /ditunda/i, label: "Ditunda", icon: RefreshCw, dot: "bg-amber-500", chip: "bg-amber-100 text-amber-700" },
  { tes: /direvalidasi|kembali aktif/i, label: "Direvalidasi", icon: RefreshCw, dot: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700" },
  { tes: /\baktif\b/i, label: "Aktif", icon: FileCheck2, dot: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-700" },
  { tes: /diterbitkan/i, label: "Diterbitkan", icon: Send, dot: "bg-blue-500", chip: "bg-blue-100 text-blue-700" },
  { tes: /disetujui/i, label: "Disetujui", icon: FileCheck2, dot: "bg-indigo-500", chip: "bg-indigo-100 text-indigo-700" },
  { tes: /diterima\b/i, label: "Diterima", icon: FileCheck2, dot: "bg-violet-500", chip: "bg-violet-100 text-violet-700" },
  { tes: /uji gas/i, label: "Uji Gas", icon: FlaskConical, dot: "bg-purple-500", chip: "bg-purple-100 text-purple-700" },
  { tes: /ruang terbatas/i, label: "CSE", icon: DoorOpen, dot: "bg-cyan-500", chip: "bg-cyan-100 text-cyan-700" },
  { tes: /naik|turun/i, label: "WAH", icon: ArrowUpDown, dot: "bg-slate-500", chip: "bg-slate-200 text-slate-700" },
  { tes: /menunggu/i, label: "Menunggu", icon: Bell, dot: "bg-slate-400", chip: "bg-slate-100 text-slate-600" },
];

function kategoriDari(pesan) {
  return KATEGORI.find((k) => k.tes.test(pesan)) ?? {
    label: "Info", icon: Bell, dot: "bg-slate-400", chip: "bg-slate-100 text-slate-600",
  };
}

// Tebalkan kata kunci status (huruf besar semua, mis. "AKTIF", "DITOLAK")
// yang muncul di tengah kalimat, meniru penekanan pada formulir aslinya.
function highlightPesan(pesan) {
  const bagian = pesan.split(/([A-ZÀ-Ý]{4,}(?:\s[A-ZÀ-Ý]{2,})*)/g);
  return bagian.map((b, i) =>
    /^[A-ZÀ-Ý]{4,}/.test(b)
      ? <span key={i} className="font-semibold text-slate-800">{b}</span>
      : <span key={i}>{b}</span>
  );
}

function waktuRelatif(tanggal) {
  const detik = Math.floor((Date.now() - new Date(tanggal).getTime()) / 1000);
  if (detik < 60) return "Baru saja";
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} mnt lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari === 1) return "Kemarin";
  if (hari < 7) return `${hari} hari lalu`;
  return new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { refresh: refreshBadge } = useNotifications();
  const [list, setList] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getNotifications()
      .then((res) => {
        setList(res.data.data);
        setUnreadCount(res.data.unread_count ?? 0);
      })
      .catch(() => toast.error("Gagal memuat notifikasi."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const buka = async (n) => {
    if (!n.dibaca) {
      try { await markNotificationRead(n.id); load(); refreshBadge(); } catch { /* abaikan */ }
    }
    if (n.permit_id) navigate(`/permits/${n.permit_id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft size={14} className="mr-2" /> Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Panel header */}
          <div className="px-6 sm:px-8 py-6 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand">
              <Bell size={19} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-800">Notifikasi</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} belum dibaca` : "Semua notifikasi sudah dibaca"}
              </p>
            </div>
            {unreadCount > 0 && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                {unreadCount}
              </span>
            )}
          </div>

          {/* List */}
          <div className="p-4 sm:p-6 space-y-3 bg-slate-50/50 min-h-[200px]">
            {loading ? (
              <p className="text-slate-500 text-sm text-center py-10">Memuat...</p>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <Inbox size={34} className="mb-2" />
                <p className="text-sm">Belum ada notifikasi.</p>
              </div>
            ) : (
              list.map((n) => {
                const k = kategoriDari(n.pesan);
                const Icon = k.icon;
                const belumDibaca = !n.dibaca;

                return (
                  <div
                    key={n.id}
                    onClick={() => buka(n)}
                    className={`group relative bg-white p-4 sm:p-5 rounded-xl border shadow-sm hover:shadow-md hover:border-brand-light transition-all duration-200 cursor-pointer ${
                      belumDibaca ? "border-slate-200" : "border-slate-100 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Indikator: berdenyut bila belum dibaca */}
                      <div className="flex-shrink-0 mt-1.5">
                        {belumDibaca ? (
                          <span className="flex h-3 w-3 relative">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${k.dot} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${k.dot}`}></span>
                          </span>
                        ) : (
                          <span className={`block w-3 h-3 rounded-full ${k.dot} opacity-60`}></span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className={`text-sm flex items-center gap-1.5 ${belumDibaca ? "font-bold text-slate-800" : "font-semibold text-slate-600"}`}>
                            <Icon size={13} className="text-slate-400 shrink-0" />
                            {n.permit?.nomor_izin ? `Izin ${n.permit.nomor_izin}` : "Notifikasi Sistem"}
                          </h3>
                          <span className="text-xs text-slate-400 font-medium shrink-0">
                            {waktuRelatif(n.created_at)}
                          </span>
                        </div>

                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded mb-2 ${k.chip}`}>
                          {k.label}
                        </span>

                        <p className="text-sm text-slate-600 leading-relaxed">
                          {highlightPesan(n.pesan)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
