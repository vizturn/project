import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { FileStack } from "lucide-react";
import { wahFileUrl } from "../services/wahService";
import { toast } from "sonner";

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
  const [scaffoldingPerlu, setScaffoldingPerlu] = useState(!!awal?.cert_scaffolding_diperlukan);
  const [scaffoldingFile, setScaffoldingFile] = useState(null);
  const [excavationPerlu, setExcavationPerlu] = useState(!!awal?.cert_excavation_diperlukan);
  const [excavationFile, setExcavationFile] = useState(null);

  // Tombol jadi abu ("tersimpan") setelah submit sukses, balik hijau saat input diubah.
  const [sudahDisimpan, setSudahDisimpan] = useState(false);
  const lewatiRenderPertama = useRef(true);
  useEffect(() => {
    if (lewatiRenderPertama.current) {
      lewatiRenderPertama.current = false;
      return;
    }
    setSudahDisimpan(false);
  }, [form, isolasiPerlu, isolasiFile, scaffoldingPerlu, scaffoldingFile, excavationPerlu, excavationFile]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const kirim = async () => {
    // Validasi ringan sisi klien untuk sertifikat wajib.
    const cek = [
      { perlu: isolasiPerlu, nomor: form.cert_isolation, file: isolasiFile, lama: awal?.cert_isolation_file_path, label: "Isolasi" },
      { perlu: scaffoldingPerlu, nomor: form.cert_scaffolding, file: scaffoldingFile, lama: awal?.cert_scaffolding_file_path, label: "Scaffolding" },
      { perlu: excavationPerlu, nomor: form.cert_excavation, file: excavationFile, lama: awal?.cert_excavation_file_path, label: "Excavation" },
    ];
    for (const c of cek) {
      if (c.perlu) {
        if (!c.nomor.trim()) {
          toast.error(`Nomor Sertifikat ${c.label} wajib diisi bila diperlukan.`);
          return;
        }
        if (!c.file && !c.lama) {
          toast.error(`File Sertifikat ${c.label} wajib diunggah bila diperlukan.`);
          return;
        }
      }
    }

    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()])
    );
    payload.cert_isolation_diperlukan = isolasiPerlu;
    payload.cert_isolation_file = isolasiFile;
    payload.cert_scaffolding_diperlukan = scaffoldingPerlu;
    payload.cert_scaffolding_file = scaffoldingFile;
    payload.cert_excavation_diperlukan = excavationPerlu;
    payload.cert_excavation_file = excavationFile;
    const ok = await onSubmit(payload);
    if (ok) {
      lewatiRenderPertama.current = true;
      setSudahDisimpan(true);
    }
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

      <div className="space-y-3">
        <p className="text-sm font-semibold text-slate-700">Sertifikat Pendukung</p>
        <SertifikatField
          label="Isolasi" nomor={form.cert_isolation} setNomor={(v) => set("cert_isolation", v)}
          perlu={isolasiPerlu} setPerlu={setIsolasiPerlu}
          file={isolasiFile} setFile={setIsolasiFile} fileLama={awal?.cert_isolation_file_path}
        />
        <SertifikatField
          label="Scaffolding" nomor={form.cert_scaffolding} setNomor={(v) => set("cert_scaffolding", v)}
          perlu={scaffoldingPerlu} setPerlu={setScaffoldingPerlu}
          file={scaffoldingFile} setFile={setScaffoldingFile} fileLama={awal?.cert_scaffolding_file_path}
        />
        <SertifikatField
          label="Excavation" nomor={form.cert_excavation} setNomor={(v) => set("cert_excavation", v)}
          perlu={excavationPerlu} setPerlu={setExcavationPerlu}
          file={excavationFile} setFile={setExcavationFile} fileLama={awal?.cert_excavation_file_path}
        />
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

      <Button onClick={kirim} busy={busy} variant={sudahDisimpan ? "saved" : "primary"}>
        {sudahDisimpan ? "✓ Tersimpan" : (sudahDiisi ? "Perbarui Bagian 4" : "Simpan Bagian 4")}
      </Button>
    </div>
  );
}

// Field sertifikat kondisional: radio Diperlukan/Tidak + (bila perlu) nomor & upload file.
function SertifikatField({ label, nomor, setNomor, perlu, setPerlu, file, setFile, fileLama }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-600 mb-1.5">Sertifikat {label}</p>
      <div className="border border-slate-200 rounded-lg p-3 space-y-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input type="radio" checked={perlu} onChange={() => setPerlu(true)} /> Diperlukan
          </label>
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input type="radio" checked={!perlu} onChange={() => setPerlu(false)} /> Tidak diperlukan
          </label>
        </div>

        {perlu && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Nomor Sertifikat {label} *</label>
              <input
                value={nomor}
                onChange={(e) => setNomor(e.target.value)}
                placeholder="Tulis nomor"
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">File Sertifikat (PDF/JPG/PNG) *</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-600 file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:bg-brand-50 file:text-brand"
              />
              {fileLama && !file && (
                <p className="text-xs text-slate-400 mt-1">
                  File tersimpan.{" "}
                  <a href={wahFileUrl(fileLama)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Lihat</a>
                  {" "}— unggah baru untuk mengganti.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
