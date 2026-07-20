import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

/**
 * Bagian 7 — Notifikasi Saat Memulai Bekerja di Ketinggian (khusus WAH).
 * PA mencatat jam naik dan/atau jam turun; boleh dicatat berkali-kali
 * selama izin berstatus AKTIF.
 */
export default function WahAccessLogForm({ onSubmit, busy }) {
  const [jamNaik, setJamNaik] = useState("");
  const [jamTurun, setJamTurun] = useState("");
  const [catatan, setCatatan] = useState("");

  const kirim = () => {
    if (!jamNaik && !jamTurun) {
      toast.error("Isi minimal salah satu: jam naik atau jam turun.");
      return;
    }
    onSubmit(
      { jam_naik: jamNaik || null, jam_turun: jamTurun || null, catatan: catatan || null },
      () => { setJamNaik(""); setJamTurun(""); setCatatan(""); }
    );
  };

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-slate-800">Bagian 7 — Notifikasi Naik/Turun (WAH)</h2>
      <p className="text-sm text-slate-500">Catat kapan Anda naik dan/atau turun. Bisa dicatat berkali-kali selama pekerjaan berlangsung.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm text-slate-600">
          <span className="flex items-center gap-1 mb-1"><ArrowUpCircle size={14} className="text-emerald-600" /> Jam Naik</span>
          <input type="time" value={jamNaik} onChange={(e) => setJamNaik(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </label>
        <label className="text-sm text-slate-600">
          <span className="flex items-center gap-1 mb-1"><ArrowDownCircle size={14} className="text-amber-600" /> Jam Turun</span>
          <input type="time" value={jamTurun} onChange={(e) => setJamTurun(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </label>
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Catatan</label>
        <input value={catatan} onChange={(e) => setCatatan(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Opsional" />
      </div>
      <button onClick={kirim} disabled={busy}
        className="px-4 py-2 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50">
        {busy ? "Menyimpan..." : "Catat Naik/Turun"}
      </button>
    </div>
  );
}
