import { useState, useEffect, useRef } from "react";
import Button from "./Button";
import { HardHat, Users, Wrench, Plus, Trash2 } from "lucide-react";
import { wahFileUrl } from "../services/wahService";

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

export default function WahPreparationForm({ awal, judul, labelTombol, onSubmit, busy }) {
  const [nomorJsa, setNomorJsa] = useState(awal?.nomor_jsa ?? "");
  const [jsaFile, setJsaFile] = useState(null);
  const [pakaiPerancah, setPakaiPerancah] = useState(!!awal?.wah_menggunakan_perancah);
  const [scaffNomor, setScaffNomor] = useState(awal?.wah_scaffolding_cert_nomor ?? "");
  const [scaffFile, setScaffFile] = useState(null);

  // Daftar pekerja: minimal satu baris. Nama diisi manual.
  // Saat awal (mode tinjau IA) tersedia, prefill dari permit.wah_workers —
  // termasuk `id` (dipakai backend untuk sync-by-id, lihat WahPreparationController::syncWorkers)
  // dan path sertifikat yang sudah tersimpan (ditampilkan sebagai link, tidak perlu upload ulang).
  const [workers, setWorkers] = useState(
    awal?.wah_workers?.length
      ? awal.wah_workers.map((w) => ({
          id: w.id,
          nama_pekerja: w.nama_pekerja,
          sudah_pelatihan: !!w.sudah_pelatihan,
          sertifikat_pelatihan_file_path: w.sertifikat_pelatihan_file_path ?? null,
          sertifikat_file: null,
        }))
      : [{ nama_pekerja: "", sudah_pelatihan: false, sertifikat_pelatihan_file_path: null, sertifikat_file: null }]
  );
  // Peralatan: { kode: true } untuk yang dicentang. Prefill dari array wah_peralatan.
  const [peralatan, setPeralatan] = useState(
    Object.fromEntries((awal?.wah_peralatan ?? []).map((k) => [k, true]))
  );
  const [peralatanLainnya, setPeralatanLainnya] = useState(awal?.wah_peralatan_lainnya ?? "");

  // Penanda "baru saja disimpan di sesi ini" (bukan dari backend). Tombol jadi
  // abu setelah submit sukses, lalu balik oren begitu ada input yang diubah.
  const [sudahDisimpan, setSudahDisimpan] = useState(false);
  const lewatiRenderPertama = useRef(true);
  useEffect(() => {
    if (lewatiRenderPertama.current) {
      lewatiRenderPertama.current = false;
      return;
    }
    setSudahDisimpan(false);
  }, [nomorJsa, jsaFile, pakaiPerancah, scaffNomor, scaffFile, workers, peralatan, peralatanLainnya]);

  const tambahWorker = () =>
    setWorkers((w) => [...w, { nama_pekerja: "", sudah_pelatihan: false, sertifikat_pelatihan_file_path: null, sertifikat_file: null }]);

  const hapusWorker = (i) =>
    setWorkers((w) => (w.length === 1 ? w : w.filter((_, idx) => idx !== i)));

  const ubahWorker = (i, field, val) =>
    setWorkers((w) => w.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  const kirim = async () => {
    // Validasi ringan di sisi klien sebelum kirim.
    const bersih = workers
      .map((w) => ({ ...w, nama_pekerja: w.nama_pekerja.trim() }))
      .filter((w) => w.nama_pekerja !== "");

    if (bersih.length === 0) {
      alert("Minimal satu pekerja harus didaftarkan.");
      return;
    }

    // Sertifikat pelatihan wajib ada (baru diunggah, atau sudah tersimpan
    // sebelumnya) untuk tiap pekerja yang "sudah pelatihan"-nya dicentang Ya.
    const kurangSertifikat = bersih.some(
      (w) => w.sudah_pelatihan && !w.sertifikat_file && !w.sertifikat_pelatihan_file_path
    );
    if (kurangSertifikat) {
      alert("Sertifikat pelatihan wajib dilampirkan untuk pekerja yang sudah mengikuti pelatihan.");
      return;
    }

    const fd = new FormData();
    if (nomorJsa.trim()) fd.append("nomor_jsa", nomorJsa);
    if (jsaFile) fd.append("jsa_file", jsaFile);
    fd.append("wah_menggunakan_perancah", pakaiPerancah ? "1" : "0");
    if (scaffNomor.trim()) fd.append("wah_scaffolding_cert_nomor", scaffNomor);
    if (scaffFile) fd.append("wah_scaffolding_cert_file", scaffFile);

    // Daftar pekerja → format array untuk Laravel: workers[0][nama_pekerja]
    // `id` disertakan untuk pekerja yang sudah ada (hasil awal/tinjau IA) agar
    // backend bisa update-in-place dan mempertahankan sertifikat lama bila
    // tidak ada file baru diunggah — lihat WahPreparationController::syncWorkers.
    bersih.forEach((w, i) => {
      if (w.id) fd.append(`workers[${i}][id]`, w.id);
      fd.append(`workers[${i}][nama_pekerja]`, w.nama_pekerja);
      fd.append(`workers[${i}][sudah_pelatihan]`, w.sudah_pelatihan ? "1" : "0");
      if (w.sertifikat_file) fd.append(`workers[${i}][sertifikat_pelatihan_file]`, w.sertifikat_file);
    });

    // Peralatan tercentang → peralatan[0], peralatan[1], ...
    Object.keys(peralatan)
      .filter((k) => peralatan[k])
      .forEach((k, i) => fd.append(`peralatan[${i}]`, k));

    if (peralatanLainnya.trim()) fd.append("peralatan_lainnya", peralatanLainnya.trim());

    const ok = await onSubmit(fd);
    if (ok) {
      // Cegah effect perubahan-input mereset penanda pada render setelah submit.
      lewatiRenderPertama.current = true;
      setSudahDisimpan(true);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <HardHat className="text-amber-600" size={18} />
        <h2 className="font-semibold text-slate-800">{judul || "Bagian 3 — Persiapan (WAH)"}</h2>
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
          {awal?.jsa_file_path && !jsaFile && (
            <p className="text-xs text-slate-400 mt-1">File tersimpan — unggah file baru untuk mengganti.</p>
          )}
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
            {awal?.wah_scaffolding_cert_file_path && !scaffFile && (
              <p className="text-xs text-slate-400 mt-1">File tersimpan — unggah file baru untuk mengganti.</p>
            )}
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
            <div key={i} className="border border-slate-200 rounded-lg p-2.5 space-y-2">
              <div className="flex items-center gap-2">
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

              {/* Sertifikat pelatihan — wajib bila "sudah pelatihan" dicentang. */}
              {w.sudah_pelatihan && (
                <div className="pl-1">
                  <label className="block text-xs text-slate-500 mb-1">Sertifikat Pelatihan Bekerja di Ketinggian *</label>
                  <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => ubahWorker(i, "sertifikat_file", e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-amber-50 file:text-amber-700" />
                  {w.sertifikat_pelatihan_file_path && !w.sertifikat_file && (
                    <p className="text-xs text-slate-400 mt-1">
                      <a href={wahFileUrl(w.sertifikat_pelatihan_file_path)} target="_blank" rel="noreferrer"
                        className="text-blue-600 hover:underline">Lihat file tersimpan</a>
                      {" — unggah file baru untuk mengganti."}
                    </p>
                  )}
                </div>
              )}
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

      <Button onClick={kirim} busy={busy} variant={sudahDisimpan ? "saved" : "primary"}>
        {sudahDisimpan ? "✓ Tersimpan" : (labelTombol || "Simpan Persiapan & Kirim ke IA")}
      </Button>
    </div>
  );
}