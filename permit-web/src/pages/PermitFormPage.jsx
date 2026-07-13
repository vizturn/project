import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPermitTypes, getWorkOrders, getEquipment } from "../services/masterService";
import { getUsersByRole } from "../services/userService";
import { createPermit } from "../services/permitService";
import { toast } from "sonner";
import { FilePlus2, ArrowLeft } from "lucide-react";

export default function PermitFormPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const screeningId = params.get("screening"); // opsional, dari alur penapisan

  const [types, setTypes] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [aaList, setAaList] = useState([]);
  const [jenisDipilih, setJenisDipilih] = useState({}); // { permit_type_id: true }
  const [iaList, setIaList] = useState([]);
  const [form, setForm] = useState({
    lokasi: "",
    deskripsi_pekerjaan: "",
    durasi: "",
    wo_id: "",
    equipment_id: "",
    approval_authority_id: "",
    issuing_authority_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getPermitTypes(), getWorkOrders(), getEquipment(), getUsersByRole("AA"), getUsersByRole("IA")])
      .then(([t, w, e, aa, ia]) => {
        setTypes(t.data.data);
        setWorkOrders(w.data.data);
        setEquipment(e.data.data);
        setAaList(aa.data.data);
        setIaList(ia.data.data);
      })
      .catch(() => toast.error("Gagal memuat data master."))
      .finally(() => setLoading(false));
  }, []);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    const idsJenis = Object.keys(jenisDipilih).filter((k) => jenisDipilih[k]).map(Number);

    if (idsJenis.length === 0) {
      toast.error("Pilih minimal satu jenis izin.");
      return;
    }
    if (!form.lokasi || !form.deskripsi_pekerjaan) {
      toast.error("Lokasi dan deskripsi wajib diisi.");
      return;
    }
    if (!form.approval_authority_id || !form.issuing_authority_id) {
      toast.error("Approval Authority (AA) dan Issuing Authority (IA) wajib dipilih.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        permit_type_ids: idsJenis,
        lokasi: form.lokasi,
        deskripsi_pekerjaan: form.deskripsi_pekerjaan,
        durasi: form.durasi || null,
        approval_authority_id: Number(form.approval_authority_id),
        issuing_authority_id: Number(form.issuing_authority_id),
        wo_id: form.wo_id ? Number(form.wo_id) : null,
        equipment_id: form.equipment_id ? Number(form.equipment_id) : null,
        screening_id: screeningId ? Number(screeningId) : null,
      };
      const res = await createPermit(payload);
      toast.success("Pengajuan izin dibuat (draft).");
      navigate(`/permits/${res.data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal membuat pengajuan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate("/permits")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft size={16} /> Daftar Izin
        </button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FilePlus2 className="text-emerald-600" size={22} />
            <h1 className="text-lg font-bold text-slate-800">Pengajuan Izin Kerja</h1>
          </div>

          {screeningId && (
            <p className="text-xs text-slate-500 mb-4">Terkait penapisan #{screeningId}</p>
          )}

          <label className="block text-sm text-slate-600 mb-1">Jenis Izin * (boleh lebih dari satu)</label>
          <p className="text-xs text-slate-500 mb-2">
            Centang semua jenis yang tercakup dalam pekerjaan ini. Contoh: pengelasan di ketinggian → Hot Work + Work at Height.
          </p>
          <div className="mb-4 border border-slate-200 rounded-lg divide-y divide-slate-100">
            {types.map((t) => (
              <label key={t.id} className="flex items-start gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-emerald-600"
                  checked={!!jenisDipilih[t.id]}
                  onChange={() => setJenisDipilih((v) => ({ ...v, [t.id]: !v[t.id] }))}
                />
                <span className="text-sm text-slate-700">
                  <span className="font-medium">{t.kode}</span> — {t.nama}
                </span>
              </label>
            ))}
          </div>

          <label className="block text-sm text-slate-600 mb-1">Lokasi Pekerjaan *</label>
          <input
            value={form.lokasi}
            onChange={(e) => setField("lokasi", e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Mis. Area Stasiun Pengumpul A"
          />

          <label className="block text-sm text-slate-600 mb-1">Deskripsi Pekerjaan *</label>
          <textarea
            value={form.deskripsi_pekerjaan}
            onChange={(e) => setField("deskripsi_pekerjaan", e.target.value)}
            rows={3}
            className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Uraian singkat pekerjaan"
          />

          <label className="block text-sm text-slate-600 mb-1">Estimasi Durasi</label>
          <input
            value={form.durasi}
            onChange={(e) => setField("durasi", e.target.value)}
            className="w-full mb-6 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Mis. 2 hari / 8 jam"
          />

          <div className="border-t border-slate-100 pt-4 mb-4">
            <p className="text-sm font-semibold text-slate-700 mb-1">Tujukan Persetujuan Kepada</p>
            <p className="text-xs text-slate-500 mb-3">Izin ini hanya dapat diproses oleh AA & IA yang Anda pilih.</p>

            <label className="block text-sm text-slate-600 mb-1">Approval Authority (AA) *</label>
            <select value={form.approval_authority_id} onChange={(e) => setField("approval_authority_id", e.target.value)}
              className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">— Pilih AA —</option>
              {aaList.map((u) => (
                <option key={u.id} value={u.id}>{u.name}{u.jabatan ? ` — ${u.jabatan}` : ""}</option>
              ))}
            </select>

            <label className="block text-sm text-slate-600 mb-1">Issuing Authority (IA) *</label>
            <select value={form.issuing_authority_id} onChange={(e) => setField("issuing_authority_id", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">— Pilih IA —</option>
              {iaList.map((u) => (
                <option key={u.id} value={u.id}>{u.name}{u.jabatan ? ` — ${u.jabatan}` : ""}</option>
              ))}
            </select>
          </div>

          <label className="block text-sm text-slate-600 mb-1">Reference WO (opsional)</label>
          <select value={form.wo_id} onChange={(e) => setField("wo_id", e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">— Tidak dipilih —</option>
            {workOrders.map((w) => (
              <option key={w.id} value={w.id}>{w.wo_number} — {w.deskripsi}</option>
            ))}
          </select>

          <label className="block text-sm text-slate-600 mb-1">Peralatan (opsional)</label>
          <select value={form.equipment_id} onChange={(e) => setField("equipment_id", e.target.value)}
            className="w-full mb-6 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">— Tidak dipilih —</option>
            {equipment.map((e2) => (
              <option key={e2.id} value={e2.id}>{e2.nama_alat} ({e2.status_kalibrasi})</option>
            ))}
          </select>

          <button onClick={submit} disabled={saving} className="w-full py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Menyimpan..." : "Buat Pengajuan (Draft)"}
          </button>
        </div>
      </div>
    </div>
  );
}
