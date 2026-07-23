import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HardHat, Wrench, UserCheck } from "lucide-react";
import { getUsersByRole } from "../services/userService";

/**
 * Bagian 3 — Persiapan (bagian PA, khusus CSE).
 * PA menetapkan Petugas Jaga (user ber-role PJ) yang akan mencatat keluar-masuk
 * personel, peralatan komunikasi, dan peralatan khusus ruang terbatas.
 */

// Peralatan khusus dari form CSE manual (FOM-00.018 Bagian 3).
const PERALATAN = [
  { kode: "escape_harness_tripod",  label: "Escape harness, line & tripod" },
  { kode: "breathing_apparatus",    label: "Breathing apparatus" },
  { kode: "stretcher_ambulance",    label: "Stretcher, ambulance" },
  { kode: "medic_first_aid",        label: "Medic, First Aid Kit" },
  { kode: "fire_extinguisher",      label: "Fire extinguishers" },
  { kode: "ventilasi_mekanis",      label: "Ventilasi mekanis" },
];

export default function CsePreparationForm({ onSubmit, busy }) {
  const [pjList, setPjList] = useState([]);
  const [petugasJagaId, setPetugasJagaId] = useState("");
  const [alatKomunikasi, setAlatKomunikasi] = useState("");
  const [peralatan, setPeralatan] = useState({});
  const [peralatanLainnya, setPeralatanLainnya] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsersByRole("PJ")
      .then((r) => setPjList(r.data.data))
      .catch(() => toast.error("Gagal memuat daftar Petugas Jaga."))
      .finally(() => setLoading(false));
  }, []);

  const kirim = () => {
    if (!petugasJagaId) {
      toast.error("Petugas Jaga wajib ditetapkan.");
      return;
    }

    onSubmit({
      cse_petugas_jaga_id: Number(petugasJagaId),
      cse_alat_komunikasi: alatKomunikasi.trim() || null,
      peralatan: Object.keys(peralatan).filter((k) => peralatan[k]),
      peralatan_lainnya: peralatanLainnya.trim() || null,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <HardHat className="text-orange-600" size={18} />
        <h2 className="font-semibold text-slate-800">Bagian 3 — Persiapan CSE (PA)</h2>
      </div>

      {/* Petugas Jaga */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <UserCheck className="text-orange-600" size={16} />
          <label className="text-sm font-semibold text-slate-700">Petugas Jaga *</label>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          Petugas jaga di luar ruang terbatas yang mencatat personel masuk dan menghitung waktu di dalam.
        </p>
        <select
          value={petugasJagaId}
          onChange={(e) => setPetugasJagaId(e.target.value)}
          disabled={loading}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:opacity-50"
        >
          <option value="">{loading ? "Memuat..." : "— Pilih Petugas Jaga —"}</option>
          {pjList.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}{u.jabatan ? ` — ${u.jabatan}` : ""}
            </option>
          ))}
        </select>
        {!loading && pjList.length === 0 && (
          <p className="text-xs text-red-600 mt-1">
            Belum ada pengguna dengan peran PJ. Hubungi Administrator.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Peralatan komunikasi yang digunakan</label>
        <input
          value={alatKomunikasi}
          onChange={(e) => setAlatKomunikasi(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Mis. HT Channel 3 (opsional)"
        />
      </div>

      {/* Peralatan khusus */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="text-orange-600" size={16} />
          <h3 className="text-sm font-semibold text-slate-700">Peralatan Khusus Ruang Terbatas</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Centang peralatan yang disiapkan. IA akan memeriksa ketersediaannya di lokasi.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PERALATAN.map((p) => (
            <label key={p.kode} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="accent-orange-600"
                checked={!!peralatan[p.kode]}
                onChange={() => setPeralatan((v) => ({ ...v, [p.kode]: !v[p.kode] }))} />
              {p.label}
            </label>
          ))}
        </div>

        <div className="mt-3">
          <label className="block text-sm text-slate-600 mb-1">Peralatan lainnya</label>
          <input value={peralatanLainnya} onChange={(e) => setPeralatanLainnya(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Ketik peralatan tambahan jika ada (opsional)" />
        </div>
      </div>

      <button onClick={kirim} disabled={busy || loading}
        className="px-4 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50">
        {busy ? "Menyimpan..." : "Simpan Persiapan & Kirim ke IA"}
      </button>
    </div>
  );
}
