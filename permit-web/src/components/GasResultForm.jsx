import { useRef, useState } from "react";
import Button from "./Button";
import { Gauge, ImagePlus, X } from "lucide-react";

/**
 * Input HASIL pengujian kadar gas.
 * Sesuai formulir, dapat dilaksanakan oleh IA maupun AGT.
 * Sistem hanya MENCATAT angka — tidak menilai aman/tidak dan tidak memblokir penerbitan.
 *
 * - petugas_nama: nama petugas yang SECARA FISIK melaksanakan pengetesan,
 *   ditulis manual (bisa beda dari akun yang login/menginput).
 * - foto: dokumentasi pengetesan, opsional, dikirim sebagai file (multipart).
 *
 * Props:
 *  - fase?: "awal" | "lanjutan" — kalau diisi, otomatis disertakan ke FormData.
 *  - onSubmit(formData: FormData)
 */
export default function GasResultForm({ onSubmit, busy, fase }) {
  const [gas, setGas] = useState({
    oksigen_persen: "",
    lel_persen: "",
    co_ppm: "",
    h2s_ppm: "",
    petugas_nama: "",
  });
  const [foto, setFoto] = useState(null); // File | null
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const pilihFoto = (e) => {
    const file = e.target.files?.[0] || null;
    setFoto(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const hapusFoto = () => {
    setFoto(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const kirim = () => {
    if (gas.oksigen_persen === "" || gas.lel_persen === "") return;
    if (!gas.petugas_nama.trim()) return;

    const fd = new FormData();
    fd.append("oksigen_persen", Number(gas.oksigen_persen));
    fd.append("lel_persen", Number(gas.lel_persen));
    if (gas.co_ppm !== "") fd.append("co_ppm", Number(gas.co_ppm));
    if (gas.h2s_ppm !== "") fd.append("h2s_ppm", Number(gas.h2s_ppm));
    fd.append("petugas_nama", gas.petugas_nama.trim());
    if (fase) fd.append("fase", fase);
    if (foto) fd.append("foto", foto);

    onSubmit(fd);

    // Reset form setelah submit supaya siap dipakai lagi (uji gas berkali-kali).
    setGas({ oksigen_persen: "", lel_persen: "", co_ppm: "", h2s_ppm: "", petugas_nama: "" });
    hapusFoto();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Gauge className="text-cyan-600" size={18} />
        <h2 className="font-semibold text-slate-800">Hasil Pengujian Kadar Gas</h2>
      </div>
      <p className="text-xs text-slate-500">
        Catat angka hasil pengukuran. Penilaian kondisi aman menjadi wewenang IA.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          ["oksigen_persen", "O₂ % *"],
          ["lel_persen", "LEL % *"],
          ["co_ppm", "CO ppm"],
          ["h2s_ppm", "H₂S ppm"],
        ].map(([k, label]) => (
          <div key={k}>
            <label className="block text-xs text-slate-500 mb-1">{label}</label>
            <input
              type="number"
              step="0.1"
              value={gas[k]}
              onChange={(e) => setGas((g) => ({ ...g, [k]: e.target.value }))}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Nama Petugas yang Menguji *</label>
        <input
          type="text"
          value={gas.petugas_nama}
          onChange={(e) => setGas((g) => ({ ...g, petugas_nama: e.target.value }))}
          placeholder="Tulis nama petugas lapangan"
          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1">Foto Dokumentasi Pengetesan (opsional)</label>
        {!previewUrl ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-cyan-400 hover:text-cyan-600"
          >
            <ImagePlus size={16} /> Pilih Foto
          </button>
        ) : (
          <div className="relative inline-block">
            <img src={previewUrl} alt="Pratinjau dokumentasi" className="h-24 w-24 object-cover rounded-lg border border-slate-200" />
            <button
              type="button"
              onClick={hapusFoto}
              className="absolute -top-2 -right-2 bg-white border border-slate-300 rounded-full p-0.5 text-slate-500 hover:text-red-600"
              title="Hapus foto"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={pilihFoto}
          className="hidden"
        />
      </div>

      <Button onClick={kirim} busy={busy}>Simpan Hasil Uji Gas</Button>
    </div>
  );
}