import { useState } from "react";
import { Gauge } from "lucide-react";

/**
 * Input HASIL pengujian kadar gas.
 * Sesuai formulir, dapat dilaksanakan oleh IA maupun AGT.
 * Sistem hanya MENCATAT angka — tidak menilai aman/tidak dan tidak memblokir penerbitan.
 */
export default function GasResultForm({ onSubmit, busy }) {
  const [gas, setGas] = useState({ oksigen_persen: "", lel_persen: "", co_ppm: "", h2s_ppm: "" });

  const kirim = () => {
    if (gas.oksigen_persen === "" || gas.lel_persen === "") return;
    onSubmit({
      oksigen_persen: Number(gas.oksigen_persen),
      lel_persen: Number(gas.lel_persen),
      co_ppm: gas.co_ppm === "" ? null : Number(gas.co_ppm),
      h2s_ppm: gas.h2s_ppm === "" ? null : Number(gas.h2s_ppm),
    });
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

      <button
        onClick={kirim}
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-50"
      >
        {busy ? "Menyimpan..." : "Simpan Hasil Uji Gas"}
      </button>
    </div>
  );
}
