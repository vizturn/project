import { useEffect, useState } from "react";
import Button from "../components/Button";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { getPermitTypes } from "../services/masterService";
import { getUsersByRole } from "../services/userService";
import { createPermit, updatePermit, getPermit } from "../services/permitService";
import { toast } from "sonner";
import { FilePlus2, PencilLine, ArrowLeft } from "lucide-react";

export default function PermitFormPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { id } = useParams();            // ada => mode EDIT, tidak ada => mode CREATE
  const isEdit = Boolean(id);
  const screeningIdParam = params.get("screening"); // opsional, hanya dipakai saat create

  const [types, setTypes] = useState([]);
  const [aaList, setAaList] = useState([]);
  const [iaList, setIaList] = useState([]);
  const [jenisDipilih, setJenisDipilih] = useState({}); // { permit_type_id: true }
  const [existingScreeningId, setExistingScreeningId] = useState(null); // Opsi A: dipertahankan apa adanya saat edit
  const [form, setForm] = useState({
    lokasi: "",
    lead_supervisor: "",
    deskripsi_pekerjaan: "",
    durasi: "",
    referensi_wo: "",
    referensi_peralatan: "",
    approval_authority_id: "",
    issuing_authority_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const masters = Promise.all([
      getPermitTypes(),
      getUsersByRole("AA"), getUsersByRole("IA"),
    ]);

    // Saat edit, ambil juga data izin yang mau diubah.
    const permitReq = isEdit ? getPermit(id) : Promise.resolve(null);

    Promise.all([masters, permitReq])
      .then(([[t, aa, ia], permitRes]) => {
        setTypes(t.data.data);
        setAaList(aa.data.data);
        setIaList(ia.data.data);

        if (isEdit && permitRes) {
          const p = permitRes.data.data;

          // Guard frontend: hanya draft yang boleh diedit. Backend juga menolak,
          // tapi ini mencegah user terlanjur mengisi form yang pasti ditolak.
          if (p.status !== "draft") {
            toast.error("Hanya izin berstatus draft yang dapat diubah.");
            navigate(`/permits/${id}`, { replace: true });
            return;
          }

          // Pre-fill form dari data lama.
          setForm({
            lokasi: p.lokasi ?? "",
            lead_supervisor: p.lead_supervisor ?? "",
            deskripsi_pekerjaan: p.deskripsi_pekerjaan ?? "",
            durasi: p.durasi ?? "",
            referensi_wo: p.referensi_wo ?? "",
            referensi_peralatan: p.referensi_peralatan ?? "",
            approval_authority_id: p.approval_authority_id ?? "",
            issuing_authority_id: p.issuing_authority_id ?? "",
          });

          // Centang jenis izin yang sudah ada (dari relasi permitTypes).
          const centang = {};
          (p.permit_types ?? p.permitTypes ?? []).forEach((pt) => { centang[pt.id] = true; });
          setJenisDipilih(centang);

          // Opsi A: screening asal dipertahankan, tidak bisa diganti saat edit.
          setExistingScreeningId(p.screening_id ?? null);
        }
      })
      .catch(() => toast.error("Gagal memuat data."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    const durasiJam = Number(form.durasi);
    if (!form.durasi || !Number.isInteger(durasiJam) || durasiJam < 1 || durasiJam > 72) {
      toast.error("Estimasi durasi wajib diisi berupa angka 1–72 jam.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        permit_type_ids: idsJenis,
        lokasi: form.lokasi,
        lead_supervisor: form.lead_supervisor || null,
        deskripsi_pekerjaan: form.deskripsi_pekerjaan,
        durasi: String(durasiJam),
        approval_authority_id: Number(form.approval_authority_id),
        issuing_authority_id: Number(form.issuing_authority_id),
        referensi_wo: form.referensi_wo || null,
        referensi_peralatan: form.referensi_peralatan || null,
        // Opsi A: saat edit kirim screening lama; saat create pakai dari query param.
        screening_id: isEdit
          ? existingScreeningId
          : (screeningIdParam ? Number(screeningIdParam) : null),
      };

      if (isEdit) {
        await updatePermit(id, payload);
        toast.success("Izin berhasil diperbarui.");
        navigate(`/permits/${id}`);
      } else {
        const res = await createPermit(payload);
        toast.success("Pengajuan izin dibuat (draft).");
        navigate(`/permits/${res.data.data.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan.");
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
        <button
          onClick={() => navigate(isEdit ? `/permits/${id}` : "/permits")}
          className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft size={16} /> {isEdit ? "Kembali ke Detail" : "Daftar Izin"}
        </button>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            {isEdit ? (
              <PencilLine className="text-emerald-600" size={22} />
            ) : (
              <FilePlus2 className="text-emerald-600" size={22} />
            )}
            <h1 className="text-lg font-bold text-slate-800">
              {isEdit ? "Ubah Izin Kerja (Draft)" : "Pengajuan Izin Kerja"}
            </h1>
          </div>

          {!isEdit && screeningIdParam && (
            <p className="text-xs text-slate-500 mb-4">Terkait penapisan #{screeningIdParam}</p>
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
            className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="Mis. Area Stasiun Pengumpul A"
          />

          <label className="block text-sm text-slate-600 mb-1">Nama Lead/Supervisor</label>
          <input
            value={form.lead_supervisor}
            onChange={(e) => setField("lead_supervisor", e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="Nama Lead/Supervisor penanggung jawab pekerjaan"
          />

          <label className="block text-sm text-slate-600 mb-1">Deskripsi Pekerjaan *</label>
          <textarea
            value={form.deskripsi_pekerjaan}
            onChange={(e) => setField("deskripsi_pekerjaan", e.target.value)}
            rows={3}
            className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="Uraian singkat pekerjaan"
          />

          <label className="block text-sm text-slate-600 mb-1">Estimasi Durasi (jam) <span className="text-red-500">*</span></label>
          <input
            type="number"
            min={1}
            max={72}
            value={form.durasi}
            onChange={(e) => setField("durasi", e.target.value)}
            className="w-full mb-6 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="Maks. 72 jam"
          />

          <div className="border-t border-slate-100 pt-4 mb-4">
            <p className="text-sm font-semibold text-slate-700 mb-1">Tujukan Persetujuan Kepada</p>
            <p className="text-xs text-slate-500 mb-3">Izin ini hanya dapat diproses oleh AA & IA yang Anda pilih.</p>

            <label className="block text-sm text-slate-600 mb-1">Approval Authority (AA) *</label>
            <select value={form.approval_authority_id} onChange={(e) => setField("approval_authority_id", e.target.value)}
              className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
              <option value="">— Pilih AA —</option>
              {aaList.map((u) => (
                <option key={u.id} value={u.id}>{u.name}{u.jabatan ? ` — ${u.jabatan}` : ""}</option>
              ))}
            </select>

            <label className="block text-sm text-slate-600 mb-1">Issuing Authority (IA) *</label>
            <select value={form.issuing_authority_id} onChange={(e) => setField("issuing_authority_id", e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand">
              <option value="">— Pilih IA —</option>
              {iaList.map((u) => (
                <option key={u.id} value={u.id}>{u.name}{u.jabatan ? ` — ${u.jabatan}` : ""}</option>
              ))}
            </select>
          </div>

          <label className="block text-sm text-slate-600 mb-1">Reference WO (opsional)</label>
          <input
            value={form.referensi_wo}
            onChange={(e) => setField("referensi_wo", e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="Ketik nomor/referensi WO"
          />

          <label className="block text-sm text-slate-600 mb-1">Equipment ID (opsional)</label>
          <input
            value={form.referensi_peralatan}
            onChange={(e) => setField("referensi_peralatan", e.target.value)}
            className="w-full mb-6 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
            placeholder="Ketik Equipment ID"
          />

          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Pengajuan (Draft)"}
          </Button>
        </div>
      </div>
    </div>
  );
}