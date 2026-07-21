import { useState } from "react";
import { HardHat, Plus, Trash2 } from "lucide-react";

const PEKERJA_KOSONG = () => ({ nama: "", telah_pelatihan: null });

const DAFTAR_ALAT_KHUSUS = [
  { key: "alat_full_body_harness", label: "Full body harness" },
  { key: "alat_double_lanyard", label: "Double lanyard" },
  { key: "alat_anchor_point", label: "Anchor Point yang disetujui" },
  { key: "alat_barrier", label: "Barrier di sekitar Lokasi kerja" },
  { key: "alat_medic_kit", label: "Medic, first aider, first aid kit" },
  { key: "alat_ambulance", label: "Ambulance" },
];

/**
 * Bagian 3 — Persiapan (khusus izin WAH).
 * PA mengisi:
 *  - JSA (nomor + file) dan, jika menggunakan perancah, Scaffolding
 *    Certificate (nomor + file) — semua opsional (fitur lama, dipertahankan).
 *  - Nama petugas pengawas keselamatan & peralatan komunikasi yang digunakan.
 *  - Daftar pekerja yang diizinkan bekerja di ketinggian, masing-masing
 *    dengan status "Telah Mengikuti Pelatihan Bekerja di Ketinggian" (Ya/Tidak).
 *  - Checklist peralatan khusus yang diperlukan (diverifikasi kelayakannya
 *    oleh IA saat Penerbitan).
 * Semua data ini tersimpan di izin dan dapat dilihat IA sebelum Penerbitan.
 */
export default function WahPreparationForm({ onSubmit, busy }) {
  const [nomorJsa, setNomorJsa] = useState("");
  const [jsaFile, setJsaFile] = useState(null);
  const [pakaiPerancah, setPakaiPerancah] = useState(false);
  const [scaffNomor, setScaffNomor] = useState("");
  const [scaffFile, setScaffFile] = useState(null);

  const [namaPetugas, setNamaPetugas] = useState("");
  const [peralatanKomunikasi, setPeralatanKomunikasi] = useState("");

  const [pekerja, setPekerja] = useState(
    Array.from({ length: 5 }, PEKERJA_KOSONG)
  );

  const [alat, setAlat] = useState({
    alat_full_body_harness: false,
    alat_double_lanyard: false,
    alat_anchor_point: false,
    alat_barrier: false,
    alat_medic_kit: false,
    alat_ambulance: false,
  });
  const [alatLainnya, setAlatLainnya] = useState("");

  const [error, setError] = useState("");

  const ubahPekerja = (idx, field, value) => {
    setPekerja((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const tambahBarisPekerja = () => setPekerja((prev) => [...prev, PEKERJA_KOSONG()]);
  const hapusBarisPekerja = (idx) =>
    setPekerja((prev) => prev.filter((_, i) => i !== idx));

  const kirim = () => {
    const pekerjaTerisi = pekerja.filter((p) => p.nama.trim() !== "");

    if (!namaPetugas.trim()) {
      setError("Nama petugas pengawas keselamatan wajib diisi.");
      return;
    }
    if (pekerjaTerisi.length === 0) {
      setError("Isi minimal satu nama pekerja pada daftar pekerja ketinggian.");
      return;
    }
    if (pekerjaTerisi.some((p) => p.telah_pelatihan === null)) {
      setError("Pilih status pelatihan (Ya/Tidak) untuk setiap pekerja yang diisi namanya.");
      return;
    }
    setError("");

    const fd = new FormData();
    if (nomorJsa.trim()) fd.append("nomor_jsa", nomorJsa);
    if (jsaFile) fd.append("jsa_file", jsaFile);
    fd.append("wah_menggunakan_perancah", pakaiPerancah ? "1" : "0");
    if (scaffNomor.trim()) fd.append("wah_scaffolding_cert_nomor", scaffNomor);
    if (scaffFile) fd.append("wah_scaffolding_cert_file", scaffFile);

    fd.append("wah_nama_petugas_pengawas", namaPetugas);
    if (peralatanKomunikasi.trim()) fd.append("wah_peralatan_komunikasi", peralatanKomunikasi);

    pekerjaTerisi.forEach((p, i) => {
      fd.append(`pekerja[${i}][nama]`, p.nama);
      fd.append(`pekerja[${i}][telah_pelatihan]`, p.telah_pelatihan ? "1" : "0");
    });

    Object.entries(alat).forEach(([key, val]) => {
      fd.append(key, val ? "1" : "0");
    });
    if (alatLainnya.trim()) fd.append("alat_lainnya", alatLainnya);

    onSubmit(fd);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <HardHat className="text-amber-600" size={18} />
        <h2 className="font-semibold text-slate-800">Bagian 3 — Persiapan (WAH)</h2>
      </div>

      {/* JSA & Scaffolding (fitur lama, dipertahankan) */}
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

      {/* Petugas pengawas & peralatan komunikasi */}
      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Petugas Pengawas Keselamatan Bekerja di Ketinggian
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Nama Petugas</label>
            <input
              value={namaPetugas}
              onChange={(e) => setNamaPetugas(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="Nama petugas pengawas"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Peralatan Komunikasi Digunakan</label>
            <input
              value={peralatanKomunikasi}
              onChange={(e) => setPeralatanKomunikasi(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              placeholder="mis. HT/Radio, Handphone (opsional)"
            />
          </div>
        </div>
      </div>

      {/* Daftar pekerja yang diizinkan bekerja di ketinggian */}
      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Daftar Pekerja yang Diizinkan Bekerja di Ketinggian
        </h3>
        <p className="text-xs text-slate-500 mb-2">
          Telah Mengikuti Pelatihan Bekerja di Ketinggian?
        </p>

        <div className="space-y-2">
          {pekerja.map((p, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                value={p.nama}
                onChange={(e) => ubahPekerja(idx, "nama", e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                placeholder={`Nama pekerja ${idx + 1}`}
              />
              <div className="flex items-center gap-3 shrink-0">
                <label className="flex items-center gap-1 text-sm text-slate-700">
                  <input
                    type="radio"
                    name={`pelatihan-${idx}`}
                    className="accent-amber-600"
                    checked={p.telah_pelatihan === true}
                    onChange={() => ubahPekerja(idx, "telah_pelatihan", true)}
                  />
                  Ya
                </label>
                <label className="flex items-center gap-1 text-sm text-slate-700">
                  <input
                    type="radio"
                    name={`pelatihan-${idx}`}
                    className="accent-amber-600"
                    checked={p.telah_pelatihan === false}
                    onChange={() => ubahPekerja(idx, "telah_pelatihan", false)}
                  />
                  Tidak
                </label>
              </div>
              <button
                type="button"
                onClick={() => hapusBarisPekerja(idx)}
                className="text-slate-400 hover:text-red-600 shrink-0"
                title="Hapus baris"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={tambahBarisPekerja}
          className="mt-2 flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800"
        >
          <Plus size={14} /> Tambah baris pekerja
        </button>
      </div>

      {/* Checklist peralatan khusus */}
      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">
          Peralatan Khusus yang Diperlukan
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DAFTAR_ALAT_KHUSUS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="accent-amber-600"
                checked={alat[key]}
                onChange={(e) => setAlat((prev) => ({ ...prev, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-2">
          <label className="block text-sm text-slate-600 mb-1">Lainnya</label>
          <input
            value={alatLainnya}
            onChange={(e) => setAlatLainnya(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Peralatan lain (opsional)"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

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
