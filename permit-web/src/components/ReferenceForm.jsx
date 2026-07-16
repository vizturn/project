import { useState } from "react";
import { FileStack } from "lucide-react";

/**
 * Bagian 4 — Referensi Pendukung (dilengkapi oleh IA).
 * Wajib disubmit sebelum izin dapat diterbitkan.
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

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const kirim = () =>
    onSubmit(
      Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()])
      )
    );

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
        <p className="text-sm font-semibold text-slate-700 mb-2">Certificates</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {input("cert_isolation", "Isolation")}
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

      <button
        onClick={kirim}
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-50"
      >
        {busy ? "Menyimpan..." : sudahDiisi ? "Perbarui Bagian 4" : "Simpan Bagian 4"}
      </button>
    </div>
  );
}
