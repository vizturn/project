import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { toast } from "sonner";
import { HardHat, Wrench, UserCheck } from "lucide-react";

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
  const [petugasJagaNama, setPetugasJagaNama] = useState("");
  const [alatKomunikasi, setAlatKomunikasi] = useState("");
  const [nomorJsa, setNomorJsa] = useState("");
  const [jsaFile, setJsaFile] = useState(null);
  const [peralatan, setPeralatan] = useState({});
  const [peralatanLainnya, setPeralatanLainnya] = useState("");

  // Tombol jadi abu ("tersimpan") setelah submit sukses, balik hijau saat input diubah.
  const [sudahDisimpan, setSudahDisimpan] = useState(false);
  const lewatiRenderPertama = useRef(true);
  useEffect(() => {
    if (lewatiRenderPertama.current) {
      lewatiRenderPertama.current = false;
      return;
    }
    setSudahDisimpan(false);
  }, [petugasJagaNama, alatKomunikasi, nomorJsa, jsaFile, peralatan, peralatanLainnya]);

  const kirim = async () => {
    if (!petugasJagaNama.trim()) {
      toast.error("Nama Petugas Jaga wajib diisi.");
      return;
    }

    const ok = await onSubmit({
      cse_petugas_jaga_nama: petugasJagaNama.trim(),
      cse_alat_komunikasi: alatKomunikasi.trim() || null,
      nomor_jsa: nomorJsa.trim() || null,
      jsa_file: jsaFile,
      peralatan: Object.keys(peralatan).filter((k) => peralatan[k]),
      peralatan_lainnya: peralatanLainnya.trim() || null,
    });
    if (ok) {
      lewatiRenderPertama.current = true;
      setSudahDisimpan(true);
    }
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
          <label className="text-sm font-semibold text-slate-700">Nama Petugas Jaga *</label>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          Petugas jaga di luar ruang terbatas yang mencatat personel masuk dan menghitung waktu di dalam.
        </p>
        <input
          value={petugasJagaNama}
          onChange={(e) => setPetugasJagaNama(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Tulis nama petugas jaga"
          maxLength={150}
        />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Nomor Job Safety Analysis (JSA)</label>
          <input
            value={nomorJsa}
            onChange={(e) => setNomorJsa(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Opsional"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">File JSA (PDF/JPG/PNG)</label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setJsaFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand"
          />
        </div>
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

      <Button onClick={kirim} busy={busy} variant={sudahDisimpan ? "saved" : "primary"}>
        {sudahDisimpan ? "✓ Tersimpan" : "Simpan Persiapan & Kirim ke IA"}
      </Button>
    </div>
  );
}
