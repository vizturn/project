import { useEffect, useState } from "react";
import { getHazardOptions } from "../services/hazardService";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

/**
 * Bagian 3 — Identifikasi Bahaya dan Pengendalian.
 * Dipakai PA (mengisi) dan IA (memeriksa: boleh menambah & menghapus).
 */
export default function HazardForm({ permit, awal, judul, labelTombol, onSubmit, busy }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({}); // { [permitTypeId]: { [noBahaya]: true } }
  const [nomorJsa, setNomorJsa] = useState(awal?.nomor_jsa ?? "");
  const [risiko, setRisiko] = useState(awal?.tingkat_risiko ?? "");
  const [lainnya, setLainnya] = useState(awal?.bahaya_lainnya ?? "");

  useEffect(() => {
    getHazardOptions(permit.id)
      .then((res) => setGroups(res.data.data))
      .catch(() => toast.error("Gagal memuat daftar bahaya."))
      .finally(() => setLoading(false));
  }, [permit.id]);

  // Pra-centang dari bahaya yang sudah tersimpan (dipakai IA saat memeriksa).
  useEffect(() => {
    const awalCentang = {};
    (permit.hazards || []).forEach((h) => {
      const tid = h.permit_type_id;
      if (!awalCentang[tid]) awalCentang[tid] = {};
      awalCentang[tid][h.no_bahaya] = true;
    });
    setChecked(awalCentang);
  }, [permit.hazards]);

  const toggle = (typeId, no) =>
    setChecked((prev) => ({
      ...prev,
      [typeId]: { ...(prev[typeId] || {}), [no]: !prev[typeId]?.[no] },
    }));

  const kirim = () => {
    if (!risiko) {
      toast.error("Tingkat risiko keseluruhan wajib dipilih.");
      return;
    }

    const hazards = groups.map((g) => ({
      permit_type_id: g.permit_type.id,
      no_bahaya: Object.keys(checked[g.permit_type.id] || {})
        .filter((n) => checked[g.permit_type.id][n])
        .map(Number),
    }));

    onSubmit({
      hazards,
      nomor_jsa: nomorJsa || null,
      tingkat_risiko: risiko,
      bahaya_lainnya: lainnya || null,
    });
  };

  if (loading) return <p className="text-sm text-slate-500">Memuat daftar bahaya...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-amber-600" size={18} />
        <h2 className="font-semibold text-slate-800">{judul}</h2>
      </div>

      <div className="space-y-4 max-h-96 overflow-auto">
        {groups.map((g) => {
          const tid = g.permit_type.id;
          const jml = Object.values(checked[tid] || {}).filter(Boolean).length;
          return (
            <div key={tid} className="border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-800">
                  {g.permit_type.kode} — {g.permit_type.nama}
                </h3>
                <span className="text-xs text-slate-400">{jml} bahaya ditandai</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {g.hazards.map((h) => (
                  <label key={h.no_bahaya} className="flex items-start gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-amber-600"
                      checked={!!checked[tid]?.[h.no_bahaya]}
                      onChange={() => toggle(tid, h.no_bahaya)}
                    />
                    <span>
                      <span className="text-slate-400 mr-1">
                        {String(h.no_bahaya).padStart(2, "0")}
                      </span>
                      {h.deskripsi}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <label className="block text-sm text-slate-600 mb-1">Uraikan bahaya-bahaya lainnya</label>
        <textarea
          value={lainnya}
          onChange={(e) => setLainnya(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          placeholder="Opsional"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-600 mb-1">Nomor Job Safety Analysis (JSA)</label>
          <input
            value={nomorJsa}
            onChange={(e) => setNomorJsa(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            placeholder="Opsional"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-600 mb-1">Tingkat risiko (berdasarkan JSA) *</label>
          <div className="flex gap-3 pt-2">
            {[["tinggi", "Tinggi"], ["sedang", "Sedang"], ["rendah", "Rendah"]].map(([v, l]) => (
              <label key={v} className="flex items-center gap-1 text-sm text-slate-600">
                <input
                  type="radio"
                  name="risiko"
                  className="accent-amber-600"
                  checked={risiko === v}
                  onChange={() => setRisiko(v)}
                />
                {l}
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={kirim}
        disabled={busy}
        className="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50"
      >
        {busy ? "Menyimpan..." : labelTombol}
      </button>
    </div>
  );
}
