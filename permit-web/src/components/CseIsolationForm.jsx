import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

/**
 * Bagian 3 — Persiapan (bagian IA, khusus CSE).
 * IA menentukan apakah Isolasi Energi diperlukan sebelum personel memasuki
 * ruang terbatas. Jika Ya, Sertifikat Isolasi (nomor + file) wajib dilampirkan.
 */
export default function CseIsolationForm({ onSubmit, busy }) {
  const [diperlukan, setDiperlukan] = useState(null); // null = belum dipilih
  const [certNomor, setCertNomor] = useState("");
  const [certFile, setCertFile] = useState(null);

  const kirim = () => {
    if (diperlukan === null) { toast.error("Pilih apakah Isolasi Energi diperlukan."); return; }
    if (diperlukan) {
      if (!certNomor.trim()) { toast.error("Nomor Sertifikat Isolasi wajib diisi."); return; }
      if (!certFile) { toast.error("File Sertifikat Isolasi wajib dilampirkan."); return; }
    }

    const fd = new FormData();
    fd.append("cse_isolasi_diperlukan", diperlukan ? "1" : "0");
    if (diperlukan) {
      fd.append("cse_isolasi_cert_nomor", certNomor);
      fd.append("cse_isolasi_cert_file", certFile);
    }

    onSubmit(fd);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-orange-600" size={18} />
        <h2 className="font-semibold text-slate-800">Bagian 3 — Evaluasi Isolasi Energi CSE (IA)</h2>
      </div>
      <p className="text-sm text-slate-500">
        Apakah ruang terbatas yang akan dimasuki memerlukan Isolasi Energi?
      </p>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="radio" name="cse_isolasi" className="accent-orange-600"
            checked={diperlukan === true} onChange={() => setDiperlukan(true)} />
          Diperlukan
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="radio" name="cse_isolasi" className="accent-orange-600"
            checked={diperlukan === false} onChange={() => setDiperlukan(false)} />
          Tidak diperlukan
        </label>
      </div>

      {diperlukan && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-l-2 border-orange-200 pl-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nomor Sertifikat Isolasi *</label>
            <input value={certNomor} onChange={(e) => setCertNomor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">File Sertifikat Isolasi *</label>
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setCertFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-orange-50 file:text-orange-700" />
          </div>
        </div>
      )}

      <button onClick={kirim} disabled={busy}
        className="px-4 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50">
        {busy ? "Menyimpan..." : "Simpan & Kirim ke PA"}
      </button>
    </div>
  );
}
