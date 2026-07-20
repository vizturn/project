import { useState } from "react";
import { HardHat } from "lucide-react";

/**
 * Bagian 3 — Persiapan (khusus izin WAH).
 * PA boleh mengisi JSA (nomor + file) dan, jika menggunakan perancah,
 * Scaffolding Certificate (nomor + file) — semua field opsional.
 */
export default function WahPreparationForm({ onSubmit, busy }) {
  const [nomorJsa, setNomorJsa] = useState("");
  const [jsaFile, setJsaFile] = useState(null);
  const [pakaiPerancah, setPakaiPerancah] = useState(false);
  const [scaffNomor, setScaffNomor] = useState("");
  const [scaffFile, setScaffFile] = useState(null);

  const kirim = () => {
    const fd = new FormData();
    if (nomorJsa.trim()) fd.append("nomor_jsa", nomorJsa);
    if (jsaFile) fd.append("jsa_file", jsaFile);
    fd.append("wah_menggunakan_perancah", pakaiPerancah ? "1" : "0");
    if (scaffNomor.trim()) fd.append("wah_scaffolding_cert_nomor", scaffNomor);
    if (scaffFile) fd.append("wah_scaffolding_cert_file", scaffFile);

    onSubmit(fd);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HardHat className="text-amber-600" size={18} />
        <h2 className="font-semibold text-slate-800">Bagian 3 — Persiapan (WAH)</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Nomor JSA</label>
          <input
            value={nomorJsa}
            onChange={(e) => setNomorJsa(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="mis. JSA-2026-014 (opsional)"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">File JSA</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setJsaFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          className="accent-amber-600"
          checked={pakaiPerancah}
          onChange={(e) => setPakaiPerancah(e.target.checked)}
        />
        Menggunakan perancah (scaffolding)
      </label>

      {pakaiPerancah && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-l-2 border-amber-200 pl-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nomor Scaffolding Certificate</label>
            <input
              value={scaffNomor}
              onChange={(e) => setScaffNomor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Opsional"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">File Scaffolding Certificate</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setScaffFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700"
            />
          </div>
        </div>
      )}

      <button
        onClick={kirim}
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50"
      >
        {busy ? "Menyimpan..." : "Simpan Persiapan & Kirim ke IA"}
      </button>
    </div>
  );
}
