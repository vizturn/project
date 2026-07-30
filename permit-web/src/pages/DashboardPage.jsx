import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getSummary, getMySummary } from "../services/reportService";
import { statusLabel } from "../lib/status";
import {
  LogOut, ShieldCheck, ClipboardList, FileText, LayoutGrid,
  Bell, ScrollText, BarChart3, FileStack,
  Clock, CircleCheck, CircleX, CircleDot, PauseCircle,
  AlertTriangle, CheckCheck, Lock,
} from "lucide-react";

// Peta status -> komponen ikon (Opsi B: ikon berwarna per status).
const IKON_STATUS = {
  draft: FileText,
  menunggu_approval: Clock,
  disetujui: CircleCheck,
  ditolak: CircleX,
  menunggu_persiapan_pa: Clock,
  menunggu_penerbitan: Clock,
  menunggu_penerimaan: Clock,
  aktif: CircleDot,
  ditunda: PauseCircle,
  kadaluarsa: AlertTriangle,
  selesai: CheckCheck,
  closed: Lock,
};

// Peta status -> kategori warna (disederhanakan jadi 5 kelompok bermakna).
// biru=info, kuning=menunggu/tunda, hijau=positif, merah=bermasalah, abu=netral.
const WARNA_STATUS = {
  // hijau - berjalan baik / positif
  aktif:     "text-emerald-600",
  disetujui: "text-emerald-600",
  selesai:   "text-emerald-600",
  // kuning/oranye - menggantung / perlu tindakan
  menunggu_approval:     "text-amber-600",
  menunggu_penerbitan:   "text-amber-600",
  menunggu_penerimaan:   "text-amber-600",
  menunggu_persiapan_pa: "text-amber-600",
  ditunda:               "text-amber-600",
  // merah - bermasalah
  ditolak:    "text-red-600",
  kadaluarsa: "text-red-600",
  // abu - netral / tidak aktif
  draft:  "text-slate-500",
  closed: "text-slate-500",
};

const warnaStatus = (s) => WARNA_STATUS[s] ?? "text-slate-500";

// Urutan tampil kartu status: ikuti perjalanan izin (menunggu -> positif ->
// masalah -> netral). Status yang tidak ada datanya otomatis dilewati.
const URUTAN_STATUS = [
  "menunggu_approval",
  "menunggu_persiapan_pa",
  "menunggu_penerbitan",
  "menunggu_penerimaan",
  "ditunda",
  "disetujui",
  "aktif",
  "selesai",
  "ditolak",
  "kadaluarsa",
  "draft",
  "closed",
];

// Urutkan entri by_status sesuai URUTAN_STATUS; status tak dikenal ditaruh akhir.
const urutkanStatus = (byStatus) =>
  Object.entries(byStatus).sort(([a], [b]) => {
    const ia = URUTAN_STATUS.indexOf(a);
    const ib = URUTAN_STATUS.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

// Kartu statistik satu status: ikon + label + angka, berwarna per kategori.
function KartuStatus({ status, jumlah }) {
  const Ikon = IKON_STATUS[status] ?? FileText;
  const warna = warnaStatus(status);
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex flex-col justify-between min-h-[104px]">
      <div className="flex items-start gap-1.5 text-slate-500 text-xs">
        <Ikon size={14} className={warna + " shrink-0 mt-0.5"} /> {statusLabel(status)}
      </div>
      <div className={"text-2xl font-bold " + warna}>{jumlah}</div>
    </div>
  );
}

const LABEL_PERAN = {
  PA: "Performing Authority",
  AA: "Approval Authority",
  IA: "Issuing Authority",
  PJ: "Petugas Jaga",
};

export default function DashboardPage() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const bolehStatistik = hasRole("SHE") || hasRole("ADM");

  const [summary, setSummary] = useState(null);
  const [loadingStat, setLoadingStat] = useState(bolehStatistik);

  // Statistik personal per peran (untuk role non-SHE/ADM: PA/AA/IA/PJ).
  const [myStats, setMyStats] = useState(null);
  const [loadingMy, setLoadingMy] = useState(!bolehStatistik);

  useEffect(() => {
    if (!bolehStatistik) return;
    getSummary()
      .then((res) => setSummary(res.data.data))
      .catch(() => setSummary(null))
      .finally(() => setLoadingStat(false));
  }, [bolehStatistik]);

  useEffect(() => {
    // Ambil statistik personal untuk pengguna non-SHE/ADM.
    if (bolehStatistik) return;
    getMySummary()
      .then((res) => setMyStats(res.data.data))
      .catch(() => setMyStats(null))
      .finally(() => setLoadingMy(false));
  }, [bolehStatistik]);

  const handleLogout = async () => {
    await logout();
    toast.success("Berhasil logout.");
    navigate("/login");
  };

  const byStatus = summary?.by_status ?? {};
  const byType = summary?.by_type ?? {};

  const menu = [
    { to: "/screening", icon: ClipboardList, judul: "Penapisan", ket: "Tentukan apakah pekerjaan butuh izin kerja." },
    { to: "/permits", icon: FileText, judul: "Izin Kerja", ket: "Ajukan, setujui, uji gas, dan terbitkan izin." },
    { to: "/board", icon: LayoutGrid, judul: "Papan Izin", ket: "Pantau izin Aktif / Ditunda / Closed real-time." },
    { to: "/notifications", icon: Bell, judul: "Notifikasi", ket: "Pemberitahuan izin ditunda / kadaluarsa." },
  ];
  const menuSheAdm = [
    { to: "/audit-logs", icon: ScrollText, judul: "Audit Log", ket: "Jejak seluruh aksi sistem." },
    { to: "/reports", icon: BarChart3, judul: "Rekap Evaluasi", ket: "Statistik izin untuk evaluasi SHE." },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-brand" size={20} />
          <h1 className="font-bold text-slate-800">Digital Permit SHE</h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-slate-600 hover:text-red-600">
          <LogOut size={16} /> Logout
        </button>
      </header>

      <main className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Sapaan + info user ringkas */}
        <div>
          <h2 className="text-xl font-bold text-slate-800">Selamat datang, {user?.name}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {user?.jabatan || "-"}
            {user?.roles?.length ? " • " : ""}
            {user?.roles?.map((r) => (
              <span key={r} className="ml-1 px-2 py-0.5 rounded bg-brand-50 text-brand text-xs font-medium">{r}</span>
            ))}
          </p>
        </div>

        {/* Kartu statistik - hanya SHE/ADM */}
        {bolehStatistik && (
          <section>
            <h3 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">Ringkasan Izin</h3>
            {loadingStat ? (
              <div className="text-sm text-slate-400">Memuat statistik…</div>
            ) : summary ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex flex-col justify-between min-h-[104px]">
                  <div className="flex items-start gap-1.5 text-slate-500 text-xs">
                    <FileStack size={14} className="text-blue-600 shrink-0 mt-0.5" /> Total Izin
                  </div>
                  <div className="text-2xl font-bold text-blue-700">{summary.total ?? 0}</div>
                </div>
                {urutkanStatus(byStatus).map(([s, jml]) => (
                  <KartuStatus key={s} status={s} jumlah={jml} />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400">Statistik belum tersedia.</div>
            )}

            {/* Rincian per jenis izin */}
            {summary && Object.keys(byType).length > 0 && (
              <div className="mt-4 bg-white rounded-xl shadow-sm p-4 border border-slate-100">
                <div className="text-slate-500 text-xs mb-3">Izin per Jenis</div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(byType).map(([kode, jumlah]) => (
                    <div key={kode} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50">
                      <span className="font-semibold text-brand">{kode}</span>
                      <span className="text-slate-700 font-medium">{jumlah}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Statistik personal per peran - untuk role non-SHE/ADM (PA/AA/IA/PJ) */}
        {!bolehStatistik && (
          <section className="space-y-5">
            {loadingMy ? (
              <div className="text-sm text-slate-400">Memuat statistik…</div>
            ) : myStats && Object.keys(myStats).length > 0 ? (
              Object.entries(myStats).map(([peran, data]) => (
                <div key={peran}>
                  <h3 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">
                    Izin Saya — {LABEL_PERAN[peran] ?? peran}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex flex-col justify-between min-h-[104px]">
                      <div className="flex items-start gap-1.5 text-slate-500 text-xs">
                        <FileStack size={14} className="text-blue-600 shrink-0 mt-0.5" /> Total
                      </div>
                      <div className="text-2xl font-bold text-blue-700">{data.total ?? 0}</div>
                    </div>
                    {urutkanStatus(data.by_status ?? {}).map(([s, jml]) => (
                      <KartuStatus key={s} status={s} jumlah={jml} />
                    ))}
                  </div>
                </div>
              ))
            ) : null}
          </section>
        )}

        {/* Menu navigasi */}
        <section>
          <h3 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">Menu</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...menu, ...(bolehStatistik ? menuSheAdm : [])].map(({ to, icon: Icon, judul, ket }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 text-left hover:shadow-md hover:border-brand-light transition"
              >
                <Icon className="text-brand mb-2" size={22} />
                <div className="font-semibold text-slate-800">{judul}</div>
                <div className="text-sm text-slate-500 mt-0.5">{ket}</div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}