import { useEffect, useState } from "react";
import Button from "../components/Button";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { getPermitTypes } from "../services/masterService";
import { getUsersByRole } from "../services/userService";
import { createPermit, updatePermit, getPermit } from "../services/permitService";
import { toast } from "sonner";
import { FilePlus2, PencilLine, ArrowLeft } from "lucide-react";

// Warna penanda jenis izin (seragam dengan dashboard, daftar izin, dan lembar cetak).
const WARNA_JENIS = { HWP: "#b91c1c", CWP: "#1d4ed8", CSE: "#c2410c", WAH: "#475569" };

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

  const kelasInput =
    "w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand";
  const kelasLabel = "block text-sm font-medium text-slate-700 mb-1.5";
  const wajib = <span className="text-red-500">*</span>;

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(isEdit ? `/permits/${id}` : "/permits")}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft size={15} /> {isEdit ? "Kembali ke Detail" : "Daftar Izin"}
        </button>

        {/* Kepala halaman */}
        <div className="flex items-center gap-2.5 mb-5">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 text-brand">
            {isEdit ? <PencilLine size={20} /> : <FilePlus2 size={20} />}
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {isEdit ? "Ubah Izin Kerja" : "Pengajuan Izin Kerja"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEdit
                ? "Perubahan hanya dapat dilakukan selama izin berstatus draft."
                : "Lengkapi uraian pekerjaan, lalu tujukan kepada AA dan IA."}
              {!isEdit && screeningIdParam && ` · Terkait penapisan #${screeningIdParam}`}
            </p>
          </div>
        </div>

        {/* ===== Jenis izin ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <label className={kelasLabel}>Jenis Izin {wajib}</label>
          <p className="text-xs text-slate-500 mb-3">
            Centang semua jenis yang tercakup dalam pekerjaan ini. Contoh: pengelasan di ketinggian
            memerlukan Hot Work sekaligus Work at Height.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {types.map((t) => {
              const dipilih = !!jenisDipilih[t.id];
              const warna = WARNA_JENIS[t.kode] ?? "#64748b";
              return (
                <label
                  key={t.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                    dipilih ? "bg-slate-50 shadow-sm" : "border-slate-200 hover:bg-slate-50"
                  }`}
                  style={dipilih ? { borderColor: warna, boxShadow: `inset 3px 0 0 ${warna}` } : undefined}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    style={{ accentColor: warna }}
                    checked={dipilih}
                    onChange={() => setJenisDipilih((v) => ({ ...v, [t.id]: !v[t.id] }))}
                  />
                  <span className="min-w-0">
                    <span
                      className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ background: warna }}
                    >
                      {t.kode}
                    </span>
                    <span className="block text-sm text-slate-700 mt-1">{t.nama}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* ===== Uraian pekerjaan ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="font-bold text-slate-800">Uraian Pekerjaan</h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Keterangan pekerjaan yang akan dilaksanakan</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={kelasLabel}>Lokasi Pekerjaan {wajib}</label>
              <input value={form.lokasi} onChange={(e) => setField("lokasi", e.target.value)}
                className={kelasInput} placeholder="Mis. Area Stasiun Pengumpul A" />
            </div>
            <div>
              <label className={kelasLabel}>Nama Lead/Supervisor</label>
              <input value={form.lead_supervisor} onChange={(e) => setField("lead_supervisor", e.target.value)}
                className={kelasInput} placeholder="Penanggung jawab pekerjaan" />
            </div>
          </div>

          <div className="mt-4">
            <label className={kelasLabel}>Deskripsi Pekerjaan {wajib}</label>
            <textarea value={form.deskripsi_pekerjaan} onChange={(e) => setField("deskripsi_pekerjaan", e.target.value)}
              rows={3} className={kelasInput} placeholder="Uraian singkat pekerjaan" />
          </div>

          <div className="mt-4 sm:w-1/2">
            <label className={kelasLabel}>Estimasi Durasi (jam) {wajib}</label>
            <input type="number" min={1} max={72} value={form.durasi}
              onChange={(e) => setField("durasi", e.target.value)}
              className={kelasInput} placeholder="Maks. 72 jam" />
            <p className="text-xs text-slate-400 mt-1">Diisi dalam satuan jam, maksimal 72 jam.</p>
          </div>
        </div>

        {/* ===== Tujukan persetujuan ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="font-bold text-slate-800">Tujukan Persetujuan Kepada</h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">
            Izin ini hanya dapat diproses oleh Approval Authority dan Issuing Authority yang Anda pilih.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={kelasLabel}>Approval Authority (AA) {wajib}</label>
              <select value={form.approval_authority_id}
                onChange={(e) => setField("approval_authority_id", e.target.value)} className={kelasInput}>
                <option value="">— Pilih AA —</option>
                {aaList.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}{u.jabatan ? ` — ${u.jabatan}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={kelasLabel}>Issuing Authority (IA) {wajib}</label>
              <select value={form.issuing_authority_id}
                onChange={(e) => setField("issuing_authority_id", e.target.value)} className={kelasInput}>
                <option value="">— Pilih IA —</option>
                {iaList.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}{u.jabatan ? ` — ${u.jabatan}` : ""}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ===== Referensi opsional ===== */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="font-bold text-slate-800">Referensi Pendukung</h2>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">Bagian ini bersifat opsional</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={kelasLabel}>Reference WO</label>
              <input value={form.referensi_wo} onChange={(e) => setField("referensi_wo", e.target.value)}
                className={kelasInput} placeholder="Nomor atau referensi WO" />
            </div>
            <div>
              <label className={kelasLabel}>Equipment ID</label>
              <input value={form.referensi_peralatan} onChange={(e) => setField("referensi_peralatan", e.target.value)}
                className={kelasInput} placeholder="Kode peralatan" />
            </div>
          </div>
        </div>

        {/* ===== Aksi ===== */}
        <div className="flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-xs text-slate-500">
            Tanda {wajib} menunjukkan kolom yang wajib diisi.
          </p>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Buat Pengajuan (Draft)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
