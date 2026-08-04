import { useState } from "react";
import Button from "./Button";
import { FileStack } from "lucide-react";
import { wahFileUrl } from "../services/wahService";

/**
 * Bagian 4 — Referensi Pendukung (dilengkapi oleh IA).
 * Wajib disubmit sebelum izin dapat diterbitkan.
 * Sertifikat Isolasi: IA menandai diperlukan; bila ya, nomor & file wajib.
 */
export default function ReferenceForm({ awal, onSubmit, busy }) {
  const [form, setForm] = useState({
    ref_permit_cse: awal?.ref_permit_cse ?? "",
    ref_permit_wah: awal?.ref_permit_wah ?? "",
    cert_isolation: awal?.cert_isolation ?? "",
    cert_scaffolding: awal?.cert_scaffolding ?? "",
    cert_excavation: awal?.cert_excavation ?? "",
    sistem_safety_dinonaktifkan: awal?.sistem_safety_dinonaktifkan ?? "",
    referensi_lainnya: awal?.referensi_lainnya ?? "",
  });
  const [isolasiPerlu, setIsolasiPerlu] = useState(!!awal?.cert_isolation_diperlukan);
  const [isolasiFile, setIsolasiFile] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const kirim = () => {
    // Validasi ringan sisi klien untuk isolasi wajib.
    if (isolasiPerlu) {
      if (!form.cert_isolation.trim()) {
        alert("Nomor Sertifikat Isolasi wajib diisi bila diperlukan.");
        return;
      }
      if (!isolasiFile && !awal?.cert_isolation_file_path) {
        alert("File Sertifikat Isolasi wajib diunggah bila diperlukan.");
        return;
      }
    }

    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()])
    );
    payload.cert_isolation_diperlukan = isolasiPerlu;
    payload.cert_isolation_file = isolasiFile; // objek File atau null
    onSubmit(payload);
  };

  const input = (k, label, placeholder = "Tulis nomor") => (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <input
        value={form[k]}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
      />
    </div>
  );

  const sudahDiisi = !!awal?.referensi_diisi_at;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileStack className="text-cyan-600" size={18} />
        <h2 className="font-semibold text-slate-800">Bagian 4 — Referensi Pendukung (IA)</h2>
        {sudahDiisi && (
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">tersimpan</span>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Wajib dilengkapi sebelum izin dapat diterbitkan. Kosongkan bidang yang tidak berlaku.
      </p>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Permit Lainnya</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {input("ref_permit_cse", "Confined Space Entry")}
          {input("ref_permit_wah", "Bekerja di Ketinggian")}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Sertifikat Isolasi</p>
        <div className="border border-slate-200 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input type="radio" name="isolasiPerlu" checked={isolasiPerlu} onChange={() => setIsolasiPerlu(true)} />
              Diperlukan
            </label>
            <label className="flex items-center gap-1.5 text-sm text-slate-600">
              <input type="radio" name="isolasiPerlu" checked={!isolasiPerlu} onChange={() => setIsolasiPerlu(false)} />
              Tidak diperlukan
            </label>
          </div>

          {isolasiPerlu && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Nomor Sertifikat Isolasi *</label>
                <input
                  value={form.cert_isolation}
                  onChange={(e) => set("cert_isolation", e.target.value)}
                  placeholder="Tulis nomor"
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">File Sertifikat (PDF/JPG/PNG) *</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setIsolasiFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:bg-brand-50 file:text-brand"
                />
                {awal?.cert_isolation_file_path && !isolasiFile && (
                  <p className="text-xs text-slate-400 mt-1">
                    File tersimpan.{" "}
                    <a href={wahFileUrl(awal.cert_isolation_file_path)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Lihat</a>
                    {" "}— unggah baru untuk mengganti.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Sertifikat Lainnya</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {input("cert_scaffolding", "Scaffolding")}
          {input("cert_excavation", "Excavation")}
        </div>
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Sistem Safety di-non-aktifkan</label>
        <textarea
          value={form.sistem_safety_dinonaktifkan}
          onChange={(e) => set("sistem_safety_dinonaktifkan", e.target.value)}
          rows={2}
          placeholder="Opsional"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">
          Referensi lainnya (MSDS, Lifting Plan, Prosedur, dll)
        </label>
        <textarea
          value={form.referensi_lainnya}
          onChange={(e) => set("referensi_lainnya", e.target.value)}
          rows={2}
          placeholder="Opsional"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
      </div>

      <Button onClick={kirim} busy={busy}>
        {sudahDiisi ? "Perbarui Bagian 4" : "Simpan Bagian 4"}
      </Button>
    </div>
  );
}
