import { useState } from "react";
import { HardHat, Users, Wrench, Plus, Trash2 } from "lucide-react";

/**
 * Bagian 3 — Persiapan (khusus izin WAH).
 * PA mengisi: JSA (opsional), Scaffolding Certificate (jika pakai perancah),
 * daftar pekerja (nama + status pelatihan), dan peralatan khusus (checklist + lainnya).
 */

// Daftar peralatan khusus dari form WAH manual (FOM-00.023 Bagian 3).
const PERALATAN = [
  { kode: "full_body_harness", label: "Full body harness" },
  { kode: "double_lanyard",    label: "Double lanyard" },
  { kode: "anchor_point",      label: "Anchor point yang disetujui" },
  { kode: "barrier",           label: "Barrier di sekitar lokasi kerja" },
  { kode: "medic",             label: "Medic / first aider / first aid kit" },
  { kode: "ambulance",         label: "Ambulance" },
];

export default function WahPreparationForm({ onSubmit, busy }) {
  const [nomorJsa, setNomorJsa] = useState("");
  const [jsaFile, setJsaFile] = useState(null);
  const [pakaiPerancah, setPakaiPerancah] = useState(false);
  const [scaffNomor, setScaffNomor] = useState("");
  const [scaffFile, setScaffFile] = useState(null);

  // Daftar pekerja: minimal satu baris. Nama diisi manual.
  const [workers, setWorkers] = useState([{ nama_pekerja: "", sudah_pelatihan: false }]);
  // Peralatan: { kode: true } untuk yang dicentang.
  const [peralatan, setPeralatan] = useState({});
  const [peralatanLainnya, setPeralatanLainnya] = useState("");

  const tambahWorker = () =>
    setWorkers((w) => [...w, { nama_pekerja: "", sudah_pelatihan: false }]);

  const hapusWorker = (i) =>
    setWorkers((w) => (w.length === 1 ? w : w.filter((_, idx) => idx !== i)));

  const ubahWorker = (i, field, val) =>
    setWorkers((w) => w.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  const kirim = () => {
    // Validasi ringan di sisi klien sebelum kirim.
    const bersih = workers
      .map((w) => ({ ...w, nama_pekerja: w.nama_pekerja.trim() }))
      .filter((w) => w.nama_pekerja !== "");

    if (bersih.length === 0) {
      alert("Minimal satu pekerja harus didaftarkan.");
      return;
    }

    const fd = new FormData();
    if (nomorJsa.trim()) fd.append("nomor_jsa", nomorJsa);
    if (jsaFile) fd.append("jsa_file", jsaFile);
    fd.append("wah_menggunakan_perancah", pakaiPerancah ? "1" : "0");
    if (scaffNomor.trim()) fd.append("wah_scaffolding_cert_nomor", scaffNomor);
    if (scaffFile) fd.append("wah_scaffolding_cert_file", scaffFile);

    // Daftar pekerja → format array untuk Laravel: workers[0][nama_pekerja]
    bersih.forEach((w, i) => {
      fd.append(`workers[${i}][nama_pekerja]`, w.nama_pekerja);
      fd.append(`workers[${i}][sudah_pelatihan]`, w.sudah_pelatihan ? "1" : "0");
    });

    // Peralatan tercentang → peralatan[0], peralatan[1], ...
    Object.keys(peralatan)
      .filter((k) => peralatan[k])
      .forEach((k, i) => fd.append(`peralatan[${i}]`, k));

    if (peralatanLainnya.trim()) fd.append("peralatan_lainnya", peralatanLainnya.trim());

    onSubmit(fd);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <HardHat className="text-amber-600" size={18} />
        <h2 className="font-semibold text-slate-800">Bagian 3 — Persiapan (WAH)</h2>
      </div>

      {/* JSA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Nomor JSA</label>
          <input value={nomorJsa} onChange={(e) => setNomorJsa(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="mis. JSA-2026-014 (opsional)" />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">File JSA</label>
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setJsaFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700" />
        </div>
      </div>

      {/* Perancah */}
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" className="accent-amber-600"
          checked={pakaiPerancah} onChange={(e) => setPakaiPerancah(e.target.checked)} />
        Menggunakan perancah (scaffolding)
      </label>
      {pakaiPerancah && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-l-2 border-amber-200 pl-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nomor Scaffolding Certificate</label>
            <input value={scaffNomor} onChange={(e) => setScaffNomor(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="Opsional" />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">File Scaffolding Certificate</label>
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setScaffFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700" />
          </div>
        </div>
      )}

      {/* Daftar Pekerja */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="text-amber-600" size={16} />
          <h3 className="text-sm font-semibold text-slate-700">Daftar Pekerja di Ketinggian *</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">Isi nama pekerja dan tandai yang sudah mengikuti pelatihan bekerja di ketinggian.</p>

        <div className="space-y-2">
          {workers.map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={w.nama_pekerja}
                onChange={(e) => ubahWorker(i, "nama_pekerja", e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder={`Nama pekerja ${i + 1}`}
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap">
                <input type="checkbox" className="accent-amber-600"
                  checked={w.sudah_pelatihan}
                  onChange={(e) => ubahWorker(i, "sudah_pelatihan", e.target.checked)} />
                Sudah pelatihan
              </label>
              <button type="button" onClick={() => hapusWorker(i)}
                disabled={workers.length === 1}
                className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30"
                title="Hapus pekerja">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button type="button" onClick={tambahWorker}
          className="mt-2 inline-flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800">
          <Plus size={16} /> Tambah Pekerja
        </button>
      </div>

      {/* Peralatan Khusus */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Wrench className="text-amber-600" size={16} />
          <h3 className="text-sm font-semibold text-slate-700">Peralatan Khusus</h3>
        </div>
        <p className="text-xs text-slate-500 mb-3">Centang peralatan yang digunakan untuk pekerjaan ini.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PERALATAN.map((p) => (
            <label key={p.kode} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="accent-amber-600"
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

      <button onClick={kirim} disabled={busy}
        className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50">
        {busy ? "Menyimpan..." : "Simpan Persiapan & Kirim ke IA"}
      </button>
    </div>
  );
}