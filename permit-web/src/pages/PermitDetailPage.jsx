import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPermit, submitPermit, approvePermit, rejectPermit, issuePermit, addGasTest, returnPermit, revalidatePermit, completePermit, closePermit, addLiveAudit, storeReferences, storeGasRequirement, acceptPermit } from "../services/permitService";
import { getPsbTypes } from "../services/masterService";
import { storeWahIsolation, storeWahPreparation, addWahAccessLog, wahFileUrl } from "../services/wahService";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import HazardForm from "../components/HazardForm";
import ReferenceForm from "../components/ReferenceForm";
import GasRequirementForm from "../components/GasRequirementForm";
import GasResultForm from "../components/GasResultForm";
import WahIsolationForm from "../components/WahIsolationForm";
import WahPreparationForm from "../components/WahPreparationForm";
import WahAccessLogForm from "../components/WahAccessLogForm";
import { submitHazards, reviewHazards } from "../services/hazardService";
import { toast } from "sonner";
import { ArrowLeft, Send, CheckCircle2, XCircle, FlaskConical, FileCheck2, RotateCcw, RefreshCw, CheckCheck, Lock, ClipboardCheck, FileText, PencilLine } from "lucide-react";

export default function PermitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // state form approval & gas test
  const [psbTypes, setPsbTypes] = useState([]);
  const [selectedPsb, setSelectedPsb] = useState({}); // { [permitTypeId]: { [psbTypeId]: true } }
  const [alasan, setAlasan] = useState("");
  const [gas, setGas] = useState({ oksigen_persen: "", lel_persen: "", co_ppm: "", h2s_ppm: "" });
  const [catatanAudit, setCatatanAudit] = useState("");
  const [setuju, setSetuju] = useState(false);

  // Bagian 8 — Pengembalian (PA) & Revalidasi (IA): tanggal & jam manual.
  const [tglKembali, setTglKembali] = useState("");
  const [jamKembali, setJamKembali] = useState("");
  const [tglRevalidasi, setTglRevalidasi] = useState("");
  const [jamRevalidasi, setJamRevalidasi] = useState("");

  // Bagian 5/6 (khusus WAH) — Penerbitan (IA) & Penerimaan (PA): tanggal & jam manual.
  const [tglTerbit, setTglTerbit] = useState("");
  const [jamTerbit, setJamTerbit] = useState("");
  const [tglTerima, setTglTerima] = useState("");
  const [jamTerima, setJamTerima] = useState("");

  const load = useCallback(() => {
    getPermit(id)
      .then((res) => setPermit(res.data.data))
      .catch(() => toast.error("Gagal memuat izin."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (hasRole("AA")) getPsbTypes().then((res) => setPsbTypes(res.data.data)).catch(() => {});
  }, [hasRole]);

  const pad = (n) => String(n).padStart(2, "0");
  const toDateInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toTimeInput = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  // Bagian 8 — isi default: PA & IA sama-sama default ke tanggal/jam saat ini,
  // masing-masing form berdiri sendiri (form IA TIDAK menyalin data PA).
  useEffect(() => {
    if (!permit) return;

    if (permit.status === "aktif" && !tglKembali) {
      const now = new Date();
      setTglKembali(toDateInput(now));
      setJamKembali(toTimeInput(now));
    }

    if (permit.status === "ditunda" && !tglRevalidasi) {
      const now = new Date();
      setTglRevalidasi(toDateInput(now));
      setJamRevalidasi(toTimeInput(now));
    }

    if (permit.status === "menunggu_penerbitan" && !tglTerbit) {
      const now = new Date();
      setTglTerbit(toDateInput(now));
      setJamTerbit(toTimeInput(now));
    }

    if (permit.status === "menunggu_penerimaan" && !tglTerima) {
      const now = new Date();
      setTglTerima(toDateInput(now));
      setJamTerima(toTimeInput(now));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permit?.status]);

  // Daftar jenis izin yang tercakup (fallback ke jenis utama untuk izin lama).
  const jenisIzin = permit?.permit_types?.length
    ? permit.permit_types
    : permit?.permit_type
      ? [permit.permit_type]
      : [];
  const isWAH = jenisIzin.some((t) => t.kode === "WAH");
  // Satu izin bisa mencakup beberapa jenis sekaligus (mis. CWP + WAH).
  // Bagian dari tiap jenis harus tampil BERSAMAAN, bukan saling meniadakan.
  const isHWPCWP = jenisIzin.some((t) => t.kode === "HWP" || t.kode === "CWP");

  const isOwnerPA = permit && Number(user?.id) === Number(permit.performing_authority_id);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const res = await fn();
      toast.success(res.data?.message || okMsg);
      load();
    } catch (err) {
      // Tampilkan pesan validasi (422) apa adanya agar penyebabnya jelas.
      const data = err.response?.data;
      const pesanValidasi = data?.errors
        ? Object.values(data.errors).flat().join(" ")
        : null;
      toast.error(pesanValidasi || data?.message || "Aksi gagal.");
    } finally {
      setBusy(false);
    }
  };

  const togglePsb = (typeId, psbId) =>
    setSelectedPsb((prev) => ({
      ...prev,
      [typeId]: { ...(prev[typeId] || {}), [psbId]: !prev[typeId]?.[psbId] },
    }));

  const doApprove = () => {
    // Kirim PSB per jenis izin: [{ permit_type_id, psb_type_ids: [...] }, ...]
    const psb = jenisIzin.map((t) => ({
      permit_type_id: t.id,
      psb_type_ids: Object.keys(selectedPsb[t.id] || {})
        .filter((k) => selectedPsb[t.id][k])
        .map(Number),
    }));

    const kosong = psb.filter((k) => k.psb_type_ids.length === 0);
    if (kosong.length > 0) {
      toast.error("Setiap jenis izin wajib memiliki minimal satu PSB.");
      return;
    }

    run(() => approvePermit(id, psb), "Izin disetujui.");
  };

  const doReturn = () => {
    if (!tglKembali || !jamKembali) { toast.error("Tanggal & jam pengembalian wajib diisi."); return; }
    run(() => returnPermit(id, { tanggal: tglKembali, jam: jamKembali }), "Izin dikembalikan.");
  };

  const doRevalidate = () => {
    if (!tglRevalidasi || !jamRevalidasi) { toast.error("Tanggal & jam revalidasi wajib diisi."); return; }
    run(() => revalidatePermit(id, { tanggal: tglRevalidasi, jam: jamRevalidasi }), "Revalidasi dikirim ke PA. Izin AKTIF kembali.");
  };

  // Bagian 5 (khusus WAH) — IA menulis tanggal & jam penerbitan secara manual.
  const doIssue = () => {
    if (isWAH) {
      if (!tglTerbit || !jamTerbit) { toast.error("Tanggal & jam penerbitan wajib diisi."); return; }
      run(() => issuePermit(id, { tanggal: tglTerbit, jam: jamTerbit }), "Izin diterbitkan.");
      return;
    }
    run(() => issuePermit(id), "Izin diterbitkan.");
  };

  // Bagian 6 (khusus WAH) — PA menulis tanggal & jam penerimaan secara manual.
  const doAccept = () => {
    if (!setuju) { toast.error("Centang pernyataan penerimaan terlebih dahulu."); return; }
    if (isWAH) {
      if (!tglTerima || !jamTerima) { toast.error("Tanggal & jam penerimaan wajib diisi."); return; }
      run(() => acceptPermit(id, { tanggal: tglTerima, jam: jamTerima }), "PTW diterima. Izin AKTIF.");
      return;
    }
    run(() => acceptPermit(id), "PTW diterima. Izin AKTIF.");
  };

  // Bagian 3 (khusus WAH) — IA menentukan kebutuhan Isolasi Energi.
  const doWahIsolation = (formData) =>
    run(() => storeWahIsolation(id, formData), "Evaluasi Isolasi Energi tersimpan. Menunggu Persiapan PA.");

  // Bagian 3 (khusus WAH) — PA upload JSA & (opsional) Scaffolding Certificate.
  const doWahPreparation = (formData) =>
    run(() => storeWahPreparation(id, formData), "Persiapan WAH tersimpan. Menunggu Penerbitan.");

  // Bagian 7 (khusus WAH) — PA mencatat naik/turun (boleh berkali-kali).
  const doWahAccessLog = (payload, onSuccess) => {
    setBusy(true);
    addWahAccessLog(id, payload)
      .then((res) => {
        toast.success(res.data?.message || "Catatan naik/turun tersimpan.");
        onSuccess?.();
        load();
      })
      .catch((err) => {
        const data = err.response?.data;
        const pesanValidasi = data?.errors ? Object.values(data.errors).flat().join(" ") : null;
        toast.error(pesanValidasi || data?.message || "Gagal menyimpan.");
      })
      .finally(() => setBusy(false));
  };

  const doGasTest = () => {
    if (gas.oksigen_persen === "" || gas.lel_persen === "") { toast.error("Oksigen & LEL wajib diisi."); return; }
    run(() => addGasTest(id, {
      oksigen_persen: Number(gas.oksigen_persen),
      lel_persen: Number(gas.lel_persen),
      co_ppm: gas.co_ppm === "" ? null : Number(gas.co_ppm),
      h2s_ppm: gas.h2s_ppm === "" ? null : Number(gas.h2s_ppm),
    }), "Uji gas tersimpan.");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Memuat...</div>;
  if (!permit) return null;

  const S = permit.status;
  const fmt = (d) => (d ? new Date(d).toLocaleString("id-ID") : "-");

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <button onClick={() => navigate("/permits")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Daftar Izin
        </button>

        {/* Ringkasan izin */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-800">{permit.nomor_izin}</h1>
            <StatusBadge status={S} />
          </div>
          <dl className="text-sm text-slate-600 grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <span className="font-medium">Jenis Izin:</span>{" "}
              {jenisIzin.length > 0
                ? jenisIzin.map((t) => (
                    <span key={t.id} className="inline-block mr-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                      {t.kode} — {t.nama}
                    </span>
                  ))
                : "-"}
            </div>
            <div><span className="font-medium">Lokasi:</span> {permit.lokasi}</div>
            <div className="col-span-2"><span className="font-medium">Deskripsi:</span> {permit.deskripsi_pekerjaan}</div>
            <div><span className="font-medium">Durasi:</span> {permit.durasi || "-"}</div>
            <div><span className="font-medium">PA:</span> {permit.performing_authority?.name ?? "-"}</div>
            <div><span className="font-medium">AA (dituju):</span> {permit.approval_authority?.name ?? "-"}</div>
            <div><span className="font-medium">IA (dituju):</span> {permit.issuing_authority?.name ?? "-"}</div>
            <div><span className="font-medium">Terbit:</span> {fmt(permit.tgl_terbit)}</div>
            <div><span className="font-medium">Kadaluarsa:</span> {fmt(permit.tgl_kadaluarsa)}</div>
          </dl>
        </div>

        {/* PSB yang ditetapkan */}
        {permit.psb_forms?.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-slate-800 mb-2">PSB Ditetapkan</h2>
            <div className="space-y-2">
              {jenisIzin.map((t) => {
                const forms = permit.psb_forms.filter((f) => f.permit_type_id === t.id);
                if (forms.length === 0) return null;
                return (
                  <div key={t.id}>
                    <div className="text-xs font-semibold text-slate-500 mb-1">{t.kode}</div>
                    <div className="flex flex-wrap gap-2">
                      {forms.map((f) => (
                        <span key={f.id} className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-xs">
                          {f.psb_type?.kode} — {f.psb_type?.nama}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
              {/* PSB lama (tanpa jenis) */}
              {permit.psb_forms.some((f) => !f.permit_type_id) && (
                <div className="flex flex-wrap gap-2">
                  {permit.psb_forms.filter((f) => !f.permit_type_id).map((f) => (
                    <span key={f.id} className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-xs">
                      {f.psb_type?.kode} — {f.psb_type?.nama}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bagian 3 tersimpan (read-only, khusus WAH) — bagian IA: Isolasi Energi */}
        {permit.wah_isolasi_diisi_at && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-indigo-600" size={18} />
              <h2 className="font-semibold text-slate-800">Evaluasi Isolasi Energi (Bagian 3 — IA)</h2>
            </div>
            <dl className="text-sm text-slate-600 space-y-1">
              <div>
                <span className="font-medium">Isolasi Energi:</span>{" "}
                {permit.wah_isolasi_diperlukan ? "Diperlukan" : "Tidak diperlukan"}
              </div>
              {permit.wah_isolasi_diperlukan && (
                <div>
                  <span className="font-medium">Sertifikat Isolasi:</span>{" "}
                  {permit.wah_isolasi_cert_nomor || "-"}
                  {permit.wah_isolasi_cert_file_path && (
                    <a href={wahFileUrl(permit.wah_isolasi_cert_file_path)} target="_blank" rel="noreferrer"
                      className="ml-2 text-blue-600 hover:underline">Lihat file</a>
                  )}
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Bagian 3 tersimpan (read-only, khusus WAH) */}
        {permit.wah_persiapan_diisi_at && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-amber-600" size={18} />
              <h2 className="font-semibold text-slate-800">Persiapan — JSA & Scaffolding (Bagian 3)</h2>
            </div>
            <dl className="text-sm text-slate-600 space-y-1">
              <div>
                <span className="font-medium">Nomor JSA:</span> {permit.nomor_jsa || "-"}
                {permit.jsa_file_path && (
                  <a href={wahFileUrl(permit.jsa_file_path)} target="_blank" rel="noreferrer"
                    className="ml-2 text-blue-600 hover:underline">Lihat file</a>
                )}
              </div>
              <div>
                <span className="font-medium">Menggunakan perancah:</span>{" "}
                {permit.wah_menggunakan_perancah ? "Ya" : "Tidak"}
              </div>
              {permit.wah_menggunakan_perancah && (
                <div>
                  <span className="font-medium">Scaffolding Certificate:</span>{" "}
                  {permit.wah_scaffolding_cert_nomor || "-"}
                  {permit.wah_scaffolding_cert_file_path && (
                    <a href={wahFileUrl(permit.wah_scaffolding_cert_file_path)} target="_blank" rel="noreferrer"
                      className="ml-2 text-blue-600 hover:underline">Lihat file</a>
                  )}
                </div>
              )}
              <div>
                <span className="font-medium">Petugas Pengawas Keselamatan:</span>{" "}
                {permit.wah_nama_petugas_pengawas || "-"}
              </div>
              <div>
                <span className="font-medium">Peralatan Komunikasi:</span>{" "}
                {permit.wah_peralatan_komunikasi || "-"}
              </div>
            </dl>

            {/* Daftar pekerja yang diizinkan bekerja di ketinggian + status pelatihan */}
            {permit.personnel?.filter((p) => p.peran_pekerjaan === "Pekerja Ketinggian (WAH)").length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium text-slate-700 mb-1">
                  Daftar Pekerja yang Diizinkan Bekerja di Ketinggian
                </div>
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-3 py-1.5 font-medium">Nama Pekerja</th>
                      <th className="text-left px-3 py-1.5 font-medium">Telah Mengikuti Pelatihan Bekerja di Ketinggian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permit.personnel
                      .filter((p) => p.peran_pekerjaan === "Pekerja Ketinggian (WAH)")
                      .map((p) => (
                        <tr key={p.id} className="border-t border-slate-100">
                          <td className="px-3 py-1.5">{p.nama}</td>
                          <td className="px-3 py-1.5">
                            <span
                              className={
                                "px-2 py-0.5 rounded text-xs font-medium " +
                                (p.telah_pelatihan_ketinggian
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700")
                              }
                            >
                              {p.telah_pelatihan_ketinggian ? "Ya" : "Tidak"}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Checklist peralatan khusus */}
            <div className="mt-3">
              <div className="text-sm font-medium text-slate-700 mb-1">Peralatan Khusus yang Diperlukan</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  ["Full body harness", permit.wah_alat_full_body_harness],
                  ["Double lanyard", permit.wah_alat_double_lanyard],
                  ["Anchor Point yang disetujui", permit.wah_alat_anchor_point],
                  ["Barrier di sekitar Lokasi kerja", permit.wah_alat_barrier],
                  ["Medic, first aider, first aid kit", permit.wah_alat_medic_kit],
                  ["Ambulance", permit.wah_alat_ambulance],
                ].map(([label, checked]) => (
                  <span
                    key={label}
                    className={
                      "px-2 py-0.5 rounded text-xs font-medium " +
                      (checked ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-400 line-through")
                    }
                  >
                    {label}
                  </span>
                ))}
                {permit.wah_alat_lainnya && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    Lainnya: {permit.wah_alat_lainnya}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bagian 3 tersimpan (read-only) */}
        {permit.hazards?.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Identifikasi Bahaya (Bagian 3)</h2>
            <div className="space-y-2">
              {jenisIzin.map((t) => {
                const items = permit.hazards.filter((h) => h.permit_type_id === t.id);
                if (items.length === 0) return null;
                return (
                  <div key={t.id}>
                    <div className="text-xs font-semibold text-slate-500 mb-1">{t.kode}</div>
                    <div className="flex flex-wrap gap-1">
                      {items.map((h) => (
                        <span key={h.id} className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs">
                          {String(h.no_bahaya).padStart(2, "0")} {h.deskripsi}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <dl className="mt-3 text-sm text-slate-600 space-y-1">
              {permit.bahaya_lainnya && (
                <div><span className="font-medium">Bahaya lainnya:</span> {permit.bahaya_lainnya}</div>
              )}
              <div><span className="font-medium">Nomor JSA:</span> {permit.nomor_jsa || "-"}</div>
              <div>
                <span className="font-medium">Tingkat risiko:</span>{" "}
                {permit.tingkat_risiko
                  ? permit.tingkat_risiko.charAt(0).toUpperCase() + permit.tingkat_risiko.slice(1)
                  : "-"}
              </div>
            </dl>
          </div>
        )}

        {/* Bagian 4 & 5 tersimpan (read-only) */}
        {(permit.referensi_diisi_at || permit.gas_ditetapkan_at) && (
          <div className="bg-white rounded-xl shadow p-6 space-y-3">
            {permit.referensi_diisi_at && (
              <div>
                <h2 className="font-semibold text-slate-800 mb-1">Referensi Pendukung (Bagian 4)</h2>
                <dl className="text-sm text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <div><span className="font-medium">CSE:</span> {permit.ref_permit_cse || "-"}</div>
                  <div><span className="font-medium">Bekerja di Ketinggian:</span> {permit.ref_permit_wah || "-"}</div>
                  <div><span className="font-medium">Isolation:</span> {permit.cert_isolation || "-"}</div>
                  <div><span className="font-medium">Scaffolding:</span> {permit.cert_scaffolding || "-"}</div>
                  <div><span className="font-medium">Excavation:</span> {permit.cert_excavation || "-"}</div>
                  {permit.sistem_safety_dinonaktifkan && (
                    <div className="sm:col-span-2">
                      <span className="font-medium">Sistem safety di-non-aktifkan:</span> {permit.sistem_safety_dinonaktifkan}
                    </div>
                  )}
                  {permit.referensi_lainnya && (
                    <div className="sm:col-span-2">
                      <span className="font-medium">Referensi lainnya:</span> {permit.referensi_lainnya}
                    </div>
                  )}
                </dl>
              </div>
            )}

            {permit.gas_ditetapkan_at && (
              <div className="border-t border-slate-100 pt-3">
                <h2 className="font-semibold text-slate-800 mb-1">Penetapan Uji Gas (Bagian 5)</h2>
                <div className="flex flex-wrap gap-2 mb-1">
                  {permit.gas_uji_flammable && <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 text-xs">Flammable (%LEL)</span>}
                  {permit.gas_uji_oksigen && <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 text-xs">Oksigen (%)</span>}
                  {permit.gas_uji_beracun && <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 text-xs">Beracun (ppm)</span>}
                  {!permit.gas_uji_flammable && !permit.gas_uji_oksigen && !permit.gas_uji_beracun && (
                    <span className="text-sm text-slate-500">Tidak ada gas yang ditetapkan wajib diuji.</span>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Periode pengetesan ulang:</span> {permit.gas_periode_ulang || "-"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Riwayat uji gas */}
        {permit.gas_tests?.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Riwayat Uji Gas</h2>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-1">Waktu</th><th>O₂%</th><th>LEL%</th><th>CO</th><th>H₂S</th><th>Hasil</th><th>AGT</th>
              </tr></thead>
              <tbody>
                {permit.gas_tests.map((g) => (
                  <tr key={g.id} className="border-b border-slate-100">
                    <td className="py-1">{g.tanggal} {g.jam}</td>
                    <td>{g.oksigen_persen}</td><td>{g.lel_persen}</td><td>{g.co_ppm ?? "-"}</td><td>{g.h2s_ppm ?? "-"}</td>
                    <td>{g.agt?.name ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ===== PANEL AKSI (sesuai role + status) ===== */}
{/* PA ubah draft — hanya saat draft & pemilik */}
{S === "draft" && isOwnerPA && (
          <button onClick={() => navigate(`/permits/${id}/edit`)} disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 text-sm font-medium hover:bg-emerald-50 disabled:opacity-50 mr-2">
            <PencilLine size={16} /> Ubah Draft
          </button>
        )}
        {/* S11: PA ajukan draft */}
        {S === "draft" && isOwnerPA && (
          <div className="bg-white rounded-xl shadow p-6">
            <button onClick={() => run(() => submitPermit(id), "Izin diajukan.")} disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
              <Send size={16} /> Ajukan untuk Persetujuan
            </button>
          </div>
        )}

        {/* S12: AA approve/reject */}
        {S === "menunggu_approval" && hasRole("AA") && (
          <div className="bg-white rounded-xl shadow p-6 space-y-3">
            <h2 className="font-semibold text-slate-800">Persetujuan (AA)</h2>
            <p className="text-sm text-slate-500">
              Tetapkan PSB (Life Saving Rules) untuk <strong>setiap</strong> jenis izin yang tercakup:
            </p>

            <div className="space-y-4 max-h-96 overflow-auto">
              {jenisIzin.map((t) => {
                const jml = Object.values(selectedPsb[t.id] || {}).filter(Boolean).length;
                return (
                  <div key={t.id} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-800">
                        {t.kode} — {t.nama}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${jml > 0 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {jml > 0 ? `${jml} PSB dipilih` : "belum diisi"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {psbTypes.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" className="accent-emerald-600"
                            checked={!!selectedPsb[t.id]?.[p.id]}
                            onChange={() => togglePsb(t.id, p.id)} />
                          {p.kode} — {p.nama}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={doApprove} disabled={busy} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                <CheckCircle2 size={16} /> Setujui
              </button>
              <input value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="Alasan penolakan (opsional)"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <button onClick={() => run(() => rejectPermit(id, alasan), "Izin ditolak.")} disabled={busy}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                <XCircle size={16} /> Tolak
              </button>
            </div>
          </div>
        )}

        {/* Uji gas oleh AGT saat izin disetujui (opsional, sebelum Bagian 3) */}
        {S === "disetujui" && hasRole("AGT") && (
          <div className="bg-white rounded-xl shadow p-6">
            <GasResultForm
              busy={busy}
              onSubmit={(payload) => run(() => addGasTest(id, payload), "Uji gas tersimpan.")}
            />
          </div>
        )}

        {/* Bagian 3 (khusus WAH), langkah 1: IA menentukan kebutuhan Isolasi Energi (saat disetujui) */}
        {S === "disetujui" && hasRole("IA") && isWAH && (
          <div className="bg-white rounded-xl shadow p-6">
            <WahIsolationForm busy={busy} onSubmit={doWahIsolation} />
          </div>
        )}

        {/* Bagian 3 (khusus WAH), langkah 2: PA mengisi JSA + Scaffolding Certificate (setelah IA selesai) */}
        {S === "menunggu_persiapan_pa" && isOwnerPA && isWAH && (
          <div className="bg-white rounded-xl shadow p-6">
            <WahPreparationForm busy={busy} onSubmit={doWahPreparation} />
          </div>
        )}

        {/* Bagian 3: PA melengkapi Identifikasi Bahaya (saat disetujui) */}
        {["disetujui", "menunggu_persiapan_pa"].includes(S) && isOwnerPA && isHWPCWP && (
          <div className="bg-white rounded-xl shadow p-6">
            <HazardForm
              permit={permit}
              awal={permit}
              judul="Bagian 3 — Identifikasi Bahaya dan Pengendalian (PA)"
              labelTombol="Simpan & Kirim ke IA"
              busy={busy}
              onSubmit={(payload) => run(() => submitHazards(id, payload), "Identifikasi bahaya tersimpan.")}
            />
          </div>
        )}

        {/* Bagian 3: IA memeriksa & boleh MENAMBAH/MENGHAPUS bahaya (saat menunggu penerbitan) — tidak berlaku untuk WAH */}
        {S === "menunggu_penerbitan" && hasRole("IA") && isHWPCWP && (
          <div className="bg-white rounded-xl shadow p-6">
            <HazardForm
              permit={permit}
              awal={permit}
              judul="Bagian 3 — Pemeriksaan Bahaya (IA) — boleh menambah/menghapus"
              labelTombol="Simpan Pemeriksaan"
              busy={busy}
              onSubmit={(payload) => run(() => reviewHazards(id, payload), "Pemeriksaan bahaya tersimpan.")}
            />
          </div>
        )}

        {/* STEP 27 — Bagian 4: Referensi Pendukung (IA) — tidak berlaku untuk WAH */}
        {S === "menunggu_penerbitan" && hasRole("IA") && isHWPCWP && (
          <div className="bg-white rounded-xl shadow p-6">
            <ReferenceForm
              awal={permit}
              busy={busy}
              onSubmit={(payload) => run(() => storeReferences(id, payload), "Bagian 4 tersimpan.")}
            />
          </div>
        )}

        {/* STEP 27 — Bagian 5: Penetapan pengujian gas (IA) — tidak berlaku untuk WAH */}
        {S === "menunggu_penerbitan" && hasRole("IA") && isHWPCWP && (
          <div className="bg-white rounded-xl shadow p-6">
            <GasRequirementForm
              awal={permit}
              busy={busy}
              onSubmit={(payload) => run(() => storeGasRequirement(id, payload), "Bagian 5 tersimpan.")}
            />
          </div>
        )}

        {/* STEP 27 — Hasil uji gas: boleh diisi IA maupun AGT — tidak berlaku untuk WAH */}
        {S === "menunggu_penerbitan" && (hasRole("IA") || hasRole("AGT")) && isHWPCWP && (
          <div className="bg-white rounded-xl shadow p-6">
            <GasResultForm
              busy={busy}
              onSubmit={(payload) => run(() => addGasTest(id, payload), "Hasil uji gas tersimpan.")}
            />
          </div>
        )}

        {/* S14: IA terbitkan (setelah PA melengkapi Bagian 3) */}
        {S === "menunggu_penerbitan" && hasRole("IA") && (
          <div className="bg-white rounded-xl shadow p-6 space-y-2">
            <h2 className="font-semibold text-slate-800">{isWAH ? "Bagian 5 — Penerbitan (IA)" : "Bagian 6 — Penerbitan (IA)"}</h2>
            <p className="text-sm text-slate-500">
              Saya, IA, menyatakan semua bahaya telah diidentifikasi, semua tindakan pencegahan telah
              dilakukan, dan kondisi aman untuk melaksanakan pekerjaan.
            </p>
            {isHWPCWP && (
              <ul className="text-xs text-slate-500 list-disc pl-5 space-y-0.5">
                <li>Bagian 4 (Referensi Pendukung) {permit.referensi_diisi_at ? "sudah diisi" : "BELUM diisi — wajib"}</li>
                <li>Masa berlaku 72 jam dihitung sejak penerbitan.</li>
              </ul>
            )}
            {isWAH && (
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm text-slate-600">
                  Tanggal Penerbitan
                  <input type="date" value={tglTerbit} onChange={(e) => setTglTerbit(e.target.value)}
                    className="block px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </label>
                <label className="text-sm text-slate-600">
                  Jam Penerbitan
                  <input type="time" value={jamTerbit} onChange={(e) => setJamTerbit(e.target.value)}
                    className="block px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </label>
              </div>
            )}
            <button onClick={doIssue} disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
              <FileCheck2 size={16} /> Terbitkan Izin
            </button>
          </div>
        )}

        {/* STEP 27 — Bagian 6/7: Penerimaan PTW oleh PA */}
        {S === "menunggu_penerimaan" && isOwnerPA && (
          <div className="bg-white rounded-xl shadow p-6 space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="text-violet-600" size={18} />
              <h2 className="font-semibold text-slate-800">{isWAH ? "Bagian 6 — Penerimaan (PA)" : "Bagian 7 — Penerimaan PTW (PA)"}</h2>
            </div>
            <p className="text-sm text-slate-600">
              Saya, PA, telah membaca dan memahami semua kondisi dalam PTW ini beserta lampirannya.
              Saya menerima tanggung jawab pelaksanaan pekerjaan sesuai PTW ini. Saya akan menghentikan
              pekerjaan dan segera memberitahukan kepada IA jika kondisi tidak aman atau jika kondisi
              dalam PTW ini berubah.
            </p>
            {isWAH && (
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm text-slate-600">
                  Tanggal Penerimaan
                  <input type="date" value={tglTerima} onChange={(e) => setTglTerima(e.target.value)}
                    className="block px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </label>
                <label className="text-sm text-slate-600">
                  Jam Penerimaan
                  <input type="time" value={jamTerima} onChange={(e) => setJamTerima(e.target.value)}
                    className="block px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </label>
              </div>
            )}
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="mt-0.5 accent-violet-600"
                checked={setuju}
                onChange={() => setSetuju((v) => !v)}
              />
              Saya menyatakan telah membaca, memahami, dan menerima PTW ini.
            </label>
            <button
              onClick={doAccept}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              Terima PTW & Aktifkan
            </button>
          </div>
        )}

        {/* Bagian 7 (khusus WAH): PA catat naik/turun (saat aktif) */}
        {S === "aktif" && isOwnerPA && isWAH && (
          <div className="bg-white rounded-xl shadow p-6">
            <WahAccessLogForm busy={busy} onSubmit={doWahAccessLog} />
          </div>
        )}

        {/* S16: PA kembalikan (Bagian 8 — Pengembalian) / S17: PA selesaikan (saat aktif) */}
        {S === "aktif" && isOwnerPA && (
          <div className="bg-white rounded-xl shadow p-6 space-y-3">
            <div>
              <h2 className="font-semibold text-slate-800 mb-2">Bagian 8 — Pengembalian (PA)</h2>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm text-slate-600">
                  Tanggal
                  <input type="date" value={tglKembali} onChange={(e) => setTglKembali(e.target.value)}
                    className="block px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </label>
                <label className="text-sm text-slate-600">
                  Jam
                  <input type="time" value={jamKembali} onChange={(e) => setJamKembali(e.target.value)}
                    className="block px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </label>
                <button onClick={doReturn} disabled={busy}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50">
                  <RotateCcw size={16} /> Kembalikan (Tunda)
                </button>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <button onClick={() => run(() => completePermit(id), "Pekerjaan selesai.")} disabled={busy}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">
                <CheckCheck size={16} /> Selesaikan Pekerjaan
              </button>
            </div>
          </div>
        )}

        {/* S16: IA revalidasi (Bagian 8 — Revalidasi, saat ditunda) — form terpisah dari Pengembalian PA */}
        {S === "ditunda" && hasRole("IA") && (
          <div className="bg-white rounded-xl shadow p-6 space-y-2">
            <h2 className="font-semibold text-slate-800">Bagian 8 — Revalidasi (IA)</h2>
            <p className="text-sm text-slate-500">
              Tentukan tanggal &amp; jam revalidasi Anda sendiri, lalu kirim ke PA — izin akan berstatus AKTIF kembali.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-sm text-slate-600">
                Tanggal Revalidasi
                <input type="date" value={tglRevalidasi} onChange={(e) => setTglRevalidasi(e.target.value)}
                  className="block px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </label>
              <label className="text-sm text-slate-600">
                Jam Revalidasi
                <input type="time" value={jamRevalidasi} onChange={(e) => setJamRevalidasi(e.target.value)}
                  className="block px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </label>
              <button onClick={doRevalidate} disabled={busy}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
                <RefreshCw size={16} /> Kirim Revalidasi ke PA
              </button>
            </div>
          </div>
        )}

        {/* S17: IA tutup (saat selesai) */}
        {S === "selesai" && hasRole("IA") && (
          <div className="bg-white rounded-xl shadow p-6">
            <button onClick={() => run(() => closePermit(id), "Izin ditutup.")} disabled={busy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50">
              <Lock size={16} /> Tutup Izin
            </button>
          </div>
        )}

        {/* S18: SPV live audit (saat aktif) */}
        {S === "aktif" && hasRole("SPV") && (
          <div className="bg-white rounded-xl shadow p-6 space-y-2">
            <div className="flex items-center gap-2"><ClipboardCheck className="text-emerald-600" size={18} /><h2 className="font-semibold text-slate-800">Live Audit (Supervisor)</h2></div>
            <textarea value={catatanAudit} onChange={(e) => setCatatanAudit(e.target.value)} rows={2}
              placeholder="Catatan temuan (opsional)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            <button onClick={() => run(() => addLiveAudit(id, catatanAudit || null), "Live audit tercatat.")} disabled={busy}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">
              Catat Live Audit
            </button>
          </div>
        )}

        {/* Riwayat live audit */}
        {permit.live_audits?.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Riwayat Live Audit</h2>
            <ul className="text-sm text-slate-600 space-y-1">
              {permit.live_audits.map((a) => (
                <li key={a.id} className="border-b border-slate-100 py-1">
                  <span className="text-slate-400">{a.tanggal} {a.jam}</span> — {a.auditor?.name ?? "-"}
                  {a.catatan ? `: ${a.catatan}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Riwayat naik/turun (khusus WAH) */}
        {permit.wah_access_logs?.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Riwayat Naik/Turun (Bagian 7 — WAH)</h2>
            <ul className="text-sm text-slate-600 space-y-1">
              {permit.wah_access_logs.map((l) => (
                <li key={l.id} className="border-b border-slate-100 py-1">
                  <span className="text-slate-400">{l.tanggal}</span>{" "}
                  {l.jam_naik && <>· Naik {l.jam_naik}</>}
                  {l.jam_turun && <>· Turun {l.jam_turun}</>}
                  {" — "}{l.dicatat_oleh?.name ?? "-"}
                  {l.catatan ? `: ${l.catatan}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Riwayat Pengembalian & Revalidasi (Bagian 8) */}
        {permit.revalidations?.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Riwayat Pengembalian &amp; Revalidasi</h2>
            <ul className="text-sm text-slate-600 space-y-1">
              {permit.revalidations.map((r) => (
                <li key={r.id} className="border-b border-slate-100 py-1">
                  <span className="text-slate-400">Dikembalikan:</span> {fmt(r.returned_at)} — {r.returned_by?.name ?? "-"}
                  {r.revalidated_at && (
                    <>
                      {" · "}
                      <span className="text-slate-400">Direvalidasi:</span> {fmt(r.revalidated_at)} — {r.revalidated_by?.name ?? "-"}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Riwayat status */}
        {permit.status_histories?.length > 0 && (
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-semibold text-slate-800 mb-2">Riwayat Status</h2>
            <ul className="text-sm text-slate-600 space-y-1">
              {permit.status_histories.map((h) => (
                <li key={h.id} className="flex items-center gap-2">
                  <StatusBadge status={h.status} /> <span className="text-slate-400">{fmt(h.changed_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
