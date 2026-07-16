import { useState } from "react";
import { FlaskConical } from "lucide-react";

/**
 * Bagian 5 — IA menetapkan pengujian kadar gas yang wajib dilaksanakan
 * dan periode pengetesan ulang. Hasil pengujian dapat diisi IA maupun AGT.
 */
export default function GasRequirementForm({ awal, onSubmit, busy }) {
  const [form, setForm] = useState({
    gas_uji_flammable: !!awal?.gas_uji_flammable,
    gas_uji_oksigen: !!awal?.gas_uji_oksigen,
    gas_uji_beracun: !!awal?.gas_uji_beracun,
    gas_periode_ulang: awal?.gas_periode_ulang ?? "",
  });

  const toggle = (k) => setForm((p) => ({ ...p, [k]: !p[k] }));

  const adaUji = form.gas_uji_flammable || form.gas_uji_oksigen || form.gas_uji_beracun;
  const sudah = !!awal?.gas_ditetapkan_at;

  const kirim = () =>
    onSubmit({
      ...form,
      gas_periode_ulang: form.gas_periode_ulang.trim() || null,
    });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="text-cyan-600" size={18} />
        <h2 className="font-semibold text-slate-800">Bagian 5 — Penetapan Pengujian Kadar Gas (IA)</h2>
        {sudah && (
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">tersimpan</span>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Tandai gas yang wajib diuji dan periode pengetesan ulangnya. Hasil pengujian
        dapat diinput oleh IA maupun AGT.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          ["gas_uji_flammable", "Flammable (%LEL)"],
          ["gas_uji_oksigen", "Oksigen (%)"],
          ["gas_uji_beracun", "Beracun (ppm)"],
        ].map(([k, label]) => (
          <label
            key={k}
            className={`flex items-center gap-2 text-sm rounded-lg border px-3 py-2 cursor-pointer ${
              form[k] ? "bg-cyan-50 border-cyan-200 text-slate-800" : "border-slate-200 text-slate-600"
            }`}
          >
            <input type="checkbox" className="accent-cyan-600" checked={form[k]} onChange={() => toggle(k)} />
            {label}
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">
          Periode pengetesan ulang {adaUji && <span className="text-red-500">*</span>}
        </label>
        <input
          value={form.gas_periode_ulang}
          onChange={(e) => setForm((p) => ({ ...p, gas_periode_ulang: e.target.value }))}
          placeholder="Mis. setiap 2 jam"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
        />
      </div>

      <button
        onClick={kirim}
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-50"
      >
        {busy ? "Menyimpan..." : sudah ? "Perbarui Bagian 5" : "Simpan Bagian 5"}
      </button>
    </div>
  );
}
