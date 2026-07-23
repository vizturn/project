import { useState } from "react";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

/**
 * Bagian 7 — Catatan keluar-masuk ruang terbatas (khusus CSE).
 * Diisi Petugas Jaga saat izin AKTIF. Jam keluar boleh dikosongkan saat
 * personel baru masuk, lalu dicatat lagi ketika keluar.
 */
export default function CseAccessLogForm({ onSubmit, busy }) {
  const hariIni = new Date().toISOString().slice(0, 10);
  const [namaPekerja, setNamaPekerja] = useState("");
  const [tanggal, setTanggal] = useState(hariIni);
  const [jamMasuk, setJamMasuk] = useState("");
  const [jamKeluar, setJamKeluar] = useState("");
  const [catatan, setCatatan] = useState("");

  const kirim = () => {
    if (!namaPekerja.trim()) { toast.error("Nama personel wajib diisi."); return; }
    if (!tanggal) { toast.error("Tanggal wajib diisi."); return; }
    if (!jamMasuk) { toast.error("Jam masuk wajib diisi."); return; }

    onSubmit({
      nama_pekerja: namaPekerja.trim(),
      tanggal,
      jam_masuk: jamMasuk,
      jam_keluar: jamKeluar || null,
      catatan: catatan.trim() || null,
    });

    setNamaPekerja("");
    setJamMasuk("");
    setJamKeluar("");
    setCatatan("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <LogIn className="text-orange-600" size={18} />
        <h2 className="font-semibold text-slate-800">Bagian 7 — Catatan Masuk/Keluar Ruang Terbatas</h2>
      </div>
      <p className="text-sm text-slate-500">
        Catat setiap personel yang masuk. IA akan diberi tahu otomatis saat personel masuk dan keluar.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-sm text-slate-600 mb-1">Nama Personel *</label>
          <input value={namaPekerja} onChange={(e) => setNamaPekerja(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Nama personel yang memasuki ruang terbatas" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Tanggal *</label>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Jam Masuk *</label>
            <input type="time" value={jamMasuk} onChange={(e) => setJamMasuk(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Jam Keluar</label>
            <input type="time" value={jamKeluar} onChange={(e) => setJamKeluar(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-slate-600 mb-1">Catatan</label>
          <input value={catatan} onChange={(e) => setCatatan(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Opsional" />
        </div>
      </div>

      <button onClick={kirim} disabled={busy}
        className="px-4 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50">
        {busy ? "Menyimpan..." : "Catat"}
      </button>
    </div>
  );
}
