import { useCallback, useEffect, useState } from "react";
import Button from "../components/Button";
import { useNavigate, useParams } from "react-router-dom";
import { getPermit, submitPermit, approvePermit, rejectPermit, issuePermit, addGasTest, returnPermit, revalidatePermit, completePermit, closePermit, addLiveAudit, storeReferences, storeGasRequirement, acceptPermit } from "../services/permitService";
import { getPsbTypes } from "../services/masterService";
import { storeWahIsolation, storeWahPreparation, reviewWahPreparation, addWahAccessLog, wahFileUrl } from "../services/wahService";
import { storeCseIsolation, storeCsePreparation, addCseAccessLog, cseFileUrl } from "../services/cseService";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import HazardForm from "../components/HazardForm";
import ReferenceForm from "../components/ReferenceForm";
import GasRequirementForm from "../components/GasRequirementForm";
import GasResultForm from "../components/GasResultForm";
import WahIsolationForm from "../components/WahIsolationForm";
import WahPreparationForm from "../components/WahPreparationForm";
import WahAccessLogForm from "../components/WahAccessLogForm";
import CseIsolationForm from "../components/CseIsolationForm";
import CsePreparationForm from "../components/CsePreparationForm";
import CseAccessLogForm from "../components/CseAccessLogForm";
import PsbFilesSection from "../components/PsbFilesSection";
import { submitHazards, reviewHazards } from "../services/hazardService";
import { toast } from "sonner";
import { ArrowLeft, Send, CheckCircle2, XCircle, FlaskConical, FileCheck2, RotateCcw, RefreshCw, CheckCheck, Lock, ClipboardCheck, FileText, PencilLine, History, Printer } from "lucide-react";
import Section from "../components/Section";

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
  const isCSE = jenisIzin.some((t) => t.kode === "CSE");
  // Bagian 4 (Referensi Pendukung) & Bagian 5 (Penetapan Uji Gas) hanya untuk HWP/CWP
  // (samakan dengan PermitService::butuhReferensiPendukung di backend).
  const butuhReferensi = jenisIzin.some((t) => ["HWP", "CWP"].includes(t.kode));

  const isOwnerPA = permit && Number(user?.id) === Number(permit.performing_authority_id);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      const res = await fn();
      toast.success(res.data?.message || okMsg);
      load();
      return true;
    } catch (err) {
      // Tampilkan pesan validasi (422) apa adanya agar penyebabnya jelas.
      const data = err.response?.data;
      const pesanValidasi = data?.errors
        ? Object.values(data.errors).flat().join(" ")
        : null;
      toast.error(pesanValidasi || data?.message || "Aksi gagal.");
      return false;
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

  // Bagian 3 (khusus CSE) — IA menentukan kebutuhan Isolasi Energi ruang terbatas.
  const doCseIsolation = (formData) =>
    run(() => storeCseIsolation(id, formData), "Evaluasi Isolasi Energi CSE tersimpan. Menunggu Persiapan PA.");

  // Bagian 3 (khusus CSE) — PA menetapkan Petugas Jaga & peralatan khusus.
  const doCsePreparation = (payload) =>
    run(() => storeCsePreparation(id, payload), "Persiapan CSE tersimpan.");

  // Bagian 7 (khusus CSE) — Petugas Jaga mencatat keluar-masuk ruang terbatas.
  const doCseAccessLog = (payload) =>
    run(() => addCseAccessLog(id, payload), "Catatan keluar-masuk tersimpan.");

  // Bagian 3 (khusus WAH) — IA menentukan kebutuhan Isolasi Energi.
  const doWahIsolation = (formData) =>
    run(() => storeWahIsolation(id, formData), "Evaluasi Isolasi Energi tersimpan.");

  // Bagian 3 (khusus WAH) — PA upload JSA & (opsional) Scaffolding Certificate.
  const doWahPreparation = (formData) =>
    run(() => storeWahPreparation(id, formData), "Persiapan WAH tersimpan.");

  // Bagian 3 (khusus WAH) — IA meninjau/mengedit Persiapan yang diisi PA.
  const doReviewWahPreparation = (formData) =>
    run(() => reviewWahPreparation(id, formData), "Pemeriksaan Persiapan WAH tersimpan.");

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
        <div className="flex items-center justify-between">
          <button onClick={() => navigate("/permits")} className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> Daftar Izin
          </button>
          {["aktif", "selesai", "closed"].includes(S) && (
            <button
              onClick={() => navigate(`/permits/${id}/print`)}
              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-dark transition"
            >
              <Printer size={16} /> Cetak Lembar PTW
            </button>
          )}
        </div>

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
            <div><span className="font-medium">Durasi:</span> {permit.durasi ? `${permit.durasi} jam` : "-"}</div>
            <div><span className="font-medium">PA:</span> {permit.performing_authority?.name ?? "-"}</div>
            <div><span className="font-medium">AA (dituju):</span> {permit.approval_authority?.name ?? "-"}</div>
            <div><span className="font-medium">IA (dituju):</span> {permit.issuing_authority?.name ?? "-"}</div>
            <div><span className="font-medium">Terbit:</span> {fmt(permit.tgl_terbit)}</div>
            <div><span className="font-medium">Kadaluarsa:</span> {fmt(permit.tgl_kadaluarsa)}</div>
          </dl>
        </div>

        {/* File PSB — diunggah AA saat menyetujui izin (wajib min. 1 sebelum approve) */}
        <PsbFilesSection
          permitId={id}
          files={permit.psb_files || []}
          bisaUnggah={
            permit.status === "disetujui" && isOwnerPA
          }
          onChanged={load}
        />

        {/* PSB yang ditetapkan */}
        {permit.psb_forms?.length > 0 && (
          <Section title="PSB Ditetapkan" icon={FileText} defaultOpen>
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
          </Section>
        )}

        {/* Bagian 3 tersimpan (read-only, khusus WAH) — bagian IA: Isolasi Energi */}
        {permit.wah_isolasi_diisi_at && (
          <Section title="Evaluasi Isolasi Energi (Bagian 3 — IA)" icon={FileText}>
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
          </Section>
        )}

        {/* Bagian 3 tersimpan (read-only, khusus CSE) */}
        {permit.cse_persiapan_diisi_at && (
          <Section title="Persiapan Ruang Terbatas (Bagian 3 — CSE)" icon={FileText}>
            <dl className="text-sm text-slate-600 space-y-1">
              <div>
                <span className="font-medium">Isolasi Energi:</span>{" "}
                {permit.cse_isolasi_diperlukan === null || permit.cse_isolasi_diperlukan === undefined
                  ? "-"
                  : permit.cse_isolasi_diperlukan ? "Diperlukan" : "Tidak diperlukan"}
                {permit.cse_isolasi_cert_nomor && ` — Sertifikat ${permit.cse_isolasi_cert_nomor}`}
                {permit.cse_isolasi_cert_file_path && (
                  <a href={cseFileUrl(permit.cse_isolasi_cert_file_path)} target="_blank" rel="noreferrer"
                    className="ml-2 text-blue-600 hover:underline">Lihat file</a>
                )}
              </div>
              <div>
                <span className="font-medium">Petugas Jaga:</span>{" "}
                {permit.cse_petugas_jaga_nama || "-"}
              </div>
              <div>
                <span className="font-medium">Peralatan Komunikasi:</span>{" "}
                {permit.cse_alat_komunikasi || "-"}
              </div>
              <div>
                <span className="font-medium">Nomor JSA:</span> {permit.nomor_jsa || "-"}
                {permit.jsa_file_path && (
                  <a href={wahFileUrl(permit.jsa_file_path)} target="_blank" rel="noreferrer"
                    className="ml-2 text-blue-600 hover:underline">Lihat file</a>
                )}
              </div>
            </dl>

            <div className="mt-3">
              <div className="text-sm font-medium text-slate-700 mb-1">Peralatan Khusus Ruang Terbatas</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  ["Escape harness, line & tripod", "escape_harness_tripod"],
                  ["Breathing apparatus", "breathing_apparatus"],
                  ["Stretcher, ambulance", "stretcher_ambulance"],
                  ["Medic, First Aid Kit", "medic_first_aid"],
                  ["Fire extinguishers", "fire_extinguisher"],
                  ["Ventilasi mekanis", "ventilasi_mekanis"],
                ].map(([label, kode]) => {
                  const dipakai = (permit.cse_peralatan || []).includes(kode);
                  return (
                    <span key={kode}
                      className={"px-2 py-0.5 rounded text-xs font-medium " +
                        (dipakai ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-400")}>
                      {label}
                    </span>
                  );
                })}
                {permit.cse_peralatan_lainnya && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                    Lainnya: {permit.cse_peralatan_lainnya}
                  </span>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Bagian 3 tersimpan (read-only, khusus WAH) */}
        {permit.wah_persiapan_diisi_at && (
          <Section title="Persiapan — JSA & Scaffolding (Bagian 3)" icon={FileText}>
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
            </dl>

            {/* Daftar pekerja yang diizinkan bekerja di ketinggian + status pelatihan */}
            {permit.wah_workers?.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium text-slate-700 mb-1">
                  Daftar Pekerja yang Diizinkan Bekerja di Ketinggian
                </div>
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-3 py-1.5 font-medium">Nama Pekerja</th>
                      <th className="text-left px-3 py-1.5 font-medium">Telah Mengikuti Pelatihan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permit.wah_workers.map((w) => (
                      <tr key={w.id} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">{w.nama_pekerja}</td>
                        <td className="px-3 py-1.5">
                          <span
                            className={
                              "px-2 py-0.5 rounded text-xs font-medium " +
                              (w.sudah_pelatihan
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700")
                            }
                          >
                            {w.sudah_pelatihan ? "Ya" : "Tidak"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Checklist peralatan khusus (dari array wah_peralatan) */}
            <div className="mt-3">
              <div className="text-sm font-medium text-slate-700 mb-1">Peralatan Khusus yang Diperlukan</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  ["Full body harness", "full_body_harness"],
                  ["Double lanyard", "double_lanyard"],
                  ["Anchor point yang disetujui", "anchor_point"],
                  ["Barrier di sekitar lokasi kerja", "barrier"],
                  ["Medic / first aider / first aid kit", "medic"],
                  ["Ambulance", "ambulance"],
                ].map(([label, kode]) => {
                  const dipakai = (permit.wah_peralatan || []).includes(kode);
                  return (
                    <span
                      key={kode}
                      className={
                        "px-2 py-0.5 rounded text-xs font-medium " +
                        (dipakai ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-400")
                      }
                    >
                      {label}
                    </span>
                  );
                })}
                {permit.wah_peralatan_lainnya && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    Lainnya: {permit.wah_peralatan_lainnya}
                  </span>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Bagian 3 tersimpan (read-only) */}
        {permit.hazards?.length > 0 && (
          <Section title="Identifikasi Bahaya (Bagian 3)" icon={FileText} defaultOpen>
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
              <div>
                <span className="font-medium">Nomor JSA:</span> {permit.nomor_jsa || "-"}
                {permit.jsa_file_path && (
                  <a href={wahFileUrl(permit.jsa_file_path)} target="_blank" rel="noreferrer"
                    className="ml-2 text-blue-600 hover:underline">Lihat file</a>
                )}
              </div>
              <div>
                <span className="font-medium">Tingkat risiko:</span>{" "}
                {permit.tingkat_risiko
                  ? permit.tingkat_risiko.charAt(0).toUpperCase() + permit.tingkat_risiko.slice(1)
                  : "-"}
              </div>
            </dl>
          </Section>
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
                  <div className="sm:col-span-2">
                    <span className="font-medium">Sertifikat Isolasi:</span>{" "}
                    {permit.cert_isolation_diperlukan ? (
                      <>
                        Diperlukan — {permit.cert_isolation || "-"}
                        {permit.cert_isolation_file_path && (
                          <a href={wahFileUrl(permit.cert_isolation_file_path)} target="_blank" rel="noreferrer"
                            className="ml-2 text-blue-600 hover:underline">Lihat file</a>
                        )}
                      </>
                    ) : "Tidak diperlukan"}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium">Sertifikat Scaffolding:</span>{" "}
                    {permit.cert_scaffolding_diperlukan ? (
                      <>
                        Diperlukan — {permit.cert_scaffolding || "-"}
                        {permit.cert_scaffolding_file_path && (
                          <a href={wahFileUrl(permit.cert_scaffolding_file_path)} target="_blank" rel="noreferrer"
                            className="ml-2 text-blue-600 hover:underline">Lihat file</a>
                        )}
                      </>
                    ) : "Tidak diperlukan"}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium">Sertifikat Excavation:</span>{" "}
                    {permit.cert_excavation_diperlukan ? (
                      <>
                        Diperlukan — {permit.cert_excavation || "-"}
                        {permit.cert_excavation_file_path && (
                          <a href={wahFileUrl(permit.cert_excavation_file_path)} target="_blank" rel="noreferrer"
                            className="ml-2 text-blue-600 hover:underline">Lihat file</a>
                        )}
                      </>
                    ) : "Tidak diperlukan"}
                  </div>
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
          <Section title="Riwayat Uji Gas" icon={FlaskConical}>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="py-1">Waktu</th><th>Fase</th><th>O₂%</th><th>LEL%</th><th>CO</th><th>H₂S</th><th>Petugas</th>
              </tr></thead>
              <tbody>
                {permit.gas_tests.map((g) => (
                  <tr key={g.id} className="border-b border-slate-100">
                    <td className="py-1">{g.tanggal} {g.jam}</td>
                    <td>{g.fase ? g.fase.charAt(0).toUpperCase() + g.fase.slice(1) : "-"}</td>
                    <td>{g.oksigen_persen}</td><td>{g.lel_persen}</td><td>{g.co_ppm ?? "-"}</td><td>{g.h2s_ppm ?? "-"}</td>
                    <td>{g.agt?.name ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* ===== PANEL AKSI (sesuai role + status) ===== */}
{/* PA ubah draft — hanya saat draft & pemilik */}
{S === "draft" && isOwnerPA && (
          <Button variant="outline" onClick={() => navigate(`/permits/${id}/edit`)} busy={busy} className="mr-2">
            <PencilLine size={16} /> Ubah Draft
          </Button>
        )}
        {/* S11: PA ajukan draft */}
        {S === "draft" && isOwnerPA && (
          <div className="bg-white rounded-xl shadow p-6">
            <Button onClick={() => run(() => submitPermit(id), "Izin diajukan.")} busy={busy}>
              <Send size={16} /> Ajukan untuk Persetujuan
            </Button>
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
              <Button onClick={doApprove} busy={busy}>
                <CheckCircle2 size={16} /> Setujui
              </Button>
              <input value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="Alasan penolakan (opsional)"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              <Button variant="danger" onClick={() => run(() => rejectPermit(id, alasan), "Izin ditolak.")} busy={busy}>
                <XCircle size={16} /> Tolak
              </Button>
            </div>
          </div>
        )}

        {/* Uji gas oleh AGT saat izin disetujui (opsional, sebelum Bagian 3) */}
        {S === "disetujui" && hasRole("AGT") && (
          <Section title="Uji Gas (AGT)" icon={FlaskConical}>
            <GasResultForm
              busy={busy}
              onSubmit={(payload) => run(() => addGasTest(id, payload), "Uji gas tersimpan.")}
            />
          </Section>
        )}

        {/*
          Bagian 3 — sekarang PA mengisi SEMUA bagian yang relevan langsung setelah
          izin DISETUJUI AA (tidak lagi menunggu giliran IA lebih dulu). Pada izin
          gabungan (mis. HWP/CWP + WAH), kedua form di bawah bisa muncul sekaligus —
          backend baru memindahkan status ke menunggu_penerbitan setelah SEMUA form
          yang relevan terisi (lihat PermitService::bagian3Selesai).
        */}

        {/* Bagian 3 (khusus CSE): PA mengisi Persiapan (petugas jaga, peralatan, JSA)
            setelah izin disetujui — bersamaan dengan identifikasi bahaya bila gabungan. */}
        {["disetujui", "menunggu_persiapan_pa"].includes(S) && isOwnerPA && isCSE && !permit.cse_persiapan_diisi_at && (
          <Section title="Persiapan Ruang Terbatas (Bagian 3 — CSE)" icon={FileText} terisi={!!permit.cse_persiapan_diisi_at}>
            <CsePreparationForm busy={busy} onSubmit={doCsePreparation} />
          </Section>
        )}

        {/* Isolasi Energi CSE (opsional): IA menentukan kebutuhan & sertifikat pada
            tahap menunggu_penerbitan, sebelum menerbitkan izin. */}
        {S === "menunggu_penerbitan" && hasRole("IA") && isCSE && !permit.cse_isolasi_diisi_at && (
          <Section title="Evaluasi Isolasi Energi CSE (Bagian 3 — IA)" icon={FileText} terisi={!!permit.cse_isolasi_diisi_at}>
            <CseIsolationForm busy={busy} onSubmit={doCseIsolation} />
          </Section>
        )}

        {/* Bagian 3 (khusus WAH): PA mengisi Persiapan (JSA/Scaffolding/Pekerja/Peralatan) */}
        {S === "disetujui" && isOwnerPA && isWAH && (
          <Section title="Persiapan Bekerja di Ketinggian (Bagian 3 — PA)" icon={FileText} terisi={!!permit.wah_persiapan_diisi_at}>
            <WahPreparationForm
              awal={permit}
              judul="Bagian 3 — Persiapan (PA, khusus WAH)"
              labelTombol={isHWPCWP ? "Simpan Persiapan WAH" : "Simpan Persiapan & Kirim ke IA"}
              busy={busy}
              onSubmit={doWahPreparation}
            />
          </Section>
        )}

        {/* Bagian 3: PA melengkapi Identifikasi Bahaya PTW (HWP/CWP) saat disetujui */}
        {["disetujui", "menunggu_persiapan_pa"].includes(S) && isOwnerPA && isHWPCWP && (
          <Section title="Identifikasi Bahaya dan Pengendalian (Bagian 3 — PA)" icon={FileText} terisi={!!permit.hazard_diisi_at}>
            <HazardForm
              permit={permit}
              awal={permit}
              judul="Bagian 3 — Identifikasi Bahaya dan Pengendalian (PA)"
              labelTombol={isWAH ? "Simpan Identifikasi Bahaya" : "Simpan & Kirim ke IA"}
              busy={busy}
              onSubmit={(payload) => run(() => submitHazards(id, payload), "Identifikasi bahaya tersimpan.")}
            />
          </Section>
        )}

        {/* Bagian 3: IA memeriksa & boleh MENAMBAH/MENGHAPUS bahaya (saat menunggu penerbitan) — HWP/CWP */}
        {S === "menunggu_penerbitan" && hasRole("IA") && isHWPCWP && (
          <Section title="Pemeriksaan Bahaya (Bagian 3 — IA)" icon={FileText} terisi={!!permit.hazard_diisi_at}>
            <HazardForm
              permit={permit}
              awal={permit}
              judul="Bagian 3 — Pemeriksaan Bahaya (IA) — boleh menambah/menghapus"
              labelTombol="Simpan Pemeriksaan"
              busy={busy}
              onSubmit={(payload) => run(() => reviewHazards(id, payload), "Pemeriksaan bahaya tersimpan.")}
            />
          </Section>
        )}

        {/* Bagian 3 (khusus WAH): IA memeriksa & boleh mengedit Persiapan yang diisi PA */}
        {S === "menunggu_penerbitan" && hasRole("IA") && isWAH && (
          <Section title="Pemeriksaan Persiapan WAH (Bagian 3 — IA)" icon={FileText} terisi={!!permit.wah_persiapan_diisi_at}>
            <WahPreparationForm
              awal={permit}
              judul="Bagian 3 — Pemeriksaan Persiapan WAH (IA) — boleh mengedit"
              labelTombol="Simpan Pemeriksaan"
              busy={busy}
              onSubmit={doReviewWahPreparation}
            />
          </Section>
        )}

        {/* Bagian 3 (khusus WAH): IA menentukan kebutuhan Isolasi Energi — SETELAH Persiapan PA */}
        {S === "menunggu_penerbitan" && hasRole("IA") && isWAH && (
          <Section title="Evaluasi Isolasi Energi WAH (Bagian 3 — IA)" icon={FileText} terisi={!!permit.wah_isolasi_diisi_at}>
            <WahIsolationForm awal={permit} busy={busy} onSubmit={doWahIsolation} />
          </Section>
        )}

        {/* STEP 27 — Bagian 4: Referensi Pendukung (IA) — hanya HWP/CWP */}
        {S === "menunggu_penerbitan" && hasRole("IA") && butuhReferensi && (
          <Section title="Bagian 4 — Referensi Pendukung (IA)" icon={FileStack} terisi={!!permit.referensi_diisi_at}>
            <ReferenceForm
              awal={permit}
              busy={busy}
              onSubmit={(payload) => run(() => storeReferences(id, payload), "Bagian 4 tersimpan.")}
            />
          </Section>
        )}

        {/* STEP 27 — Bagian 5: Penetapan gas + hasil uji gas (IA) — hanya HWP/CWP (digabung) */}
        {S === "menunggu_penerbitan" && hasRole("IA") && butuhReferensi && (
          <Section title="Bagian 5 — Pengujian Kadar Gas (IA)" icon={FlaskConical} terisi={!!permit.gas_ditetapkan_at}>
            <div className="space-y-4">
              <GasRequirementForm
                awal={permit}
                busy={busy}
                onSubmit={(payload) => run(() => storeGasRequirement(id, payload), "Bagian 5 tersimpan.")}
              />
              <div className="border-t border-slate-100 pt-4">
                <GasResultForm
                  busy={busy}
                  onSubmit={(payload) => run(() => addGasTest(id, payload), "Hasil uji gas tersimpan.")}
                />
              </div>
            </div>
          </Section>
        )}

        {/* CSE — Pengujian Kadar Gas AWAL (wajib sebelum penerbitan), oleh IA */}
        {S === "menunggu_penerbitan" && hasRole("IA") && isCSE && (
          <Section title="Pengujian Kadar Gas — Awal (Bagian 4 — CSE)" icon={FlaskConical}>
            <p className="text-sm text-slate-500 mb-3">Wajib diisi sebelum menerbitkan izin. Pengujian lanjutan diisi saat izin aktif.</p>
            <GasResultForm
              busy={busy}
              onSubmit={(payload) => run(() => addGasTest(id, { ...payload, fase: "awal" }), "Pengujian gas awal tersimpan.")}
            />
          </Section>
        )}

        {/* S14: IA terbitkan (setelah PA melengkapi Bagian 3) */}
        {S === "menunggu_penerbitan" && hasRole("IA") && (
          <Section title={isWAH ? "Bagian 5 — Penerbitan (IA)" : "Bagian 6 — Penerbitan (IA)"} icon={FileCheck2}>
            <div className="space-y-2">
            <p className="text-sm text-slate-500">
              Saya, IA, menyatakan semua bahaya telah diidentifikasi, semua tindakan pencegahan telah
              dilakukan, dan kondisi aman untuk melaksanakan pekerjaan.
            </p>
            {(butuhReferensi || isWAH) && (
              <ul className="text-xs text-slate-500 list-disc pl-5 space-y-0.5">
                {butuhReferensi && (
                  <li>Bagian 4 (Referensi Pendukung) {permit.referensi_diisi_at ? "sudah diisi" : "BELUM diisi — wajib"}</li>
                )}
                {isWAH && (
                  <li>Bagian 3 (Isolasi Energi WAH) {permit.wah_isolasi_diisi_at ? "sudah diisi" : "BELUM diisi — wajib"}</li>
                )}
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
            <Button onClick={doIssue} busy={busy}>
              <FileCheck2 size={16} /> Terbitkan Izin
            </Button>
            </div>
          </Section>
        )}

        {/* STEP 27 — Bagian 6/7: Penerimaan PTW oleh PA */}
        {S === "menunggu_penerimaan" && isOwnerPA && (
          <Section title={isWAH ? "Bagian 6 — Penerimaan (PA)" : "Bagian 7 — Penerimaan PTW (PA)"} icon={ClipboardCheck}>
            <div className="space-y-3">
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
            <Button onClick={doAccept} busy={busy}>
              Terima PTW &amp; Aktifkan
            </Button>
            </div>
          </Section>
        )}

        {/* CSE — Pengujian Kadar Gas LANJUTAN (saat izin aktif), oleh IA, bisa berkali-kali */}
        {S === "aktif" && isCSE && hasRole("IA") && (
          <Section title="Pengujian Kadar Gas — Lanjutan (Bagian 4 — CSE)" icon={FlaskConical}>
            <p className="text-sm text-slate-500 mb-3">Pengujian ulang selama pekerjaan berlangsung. Waktu dicatat otomatis; tambah setiap kali melakukan pengujian.</p>
            <GasResultForm
              busy={busy}
              onSubmit={(payload) => run(() => addGasTest(id, { ...payload, fase: "lanjutan" }), "Pengujian gas lanjutan tersimpan.")}
            />
          </Section>
        )}

        {/* Bagian 7 (khusus CSE): Petugas Jaga / PA catat keluar-masuk ruang terbatas (saat aktif) */}
        {S === "aktif" && isCSE && isOwnerPA && (
          <Section title="Catatan Masuk/Keluar Ruang Terbatas (Bagian 7 — CSE)" icon={ClipboardCheck}>
            <CseAccessLogForm busy={busy} onSubmit={doCseAccessLog} />
          </Section>
        )}

        {/* Bagian 7 (khusus WAH): PA catat naik/turun (saat aktif) */}
        {S === "aktif" && isOwnerPA && isWAH && (
          <Section title="Catatan Naik/Turun (Bagian 7 — WAH)" icon={ClipboardCheck}>
            <WahAccessLogForm busy={busy} onSubmit={doWahAccessLog} />
          </Section>
        )}

        {/* S16: PA kembalikan (Bagian 8 — Pengembalian) / S17: PA selesaikan (saat aktif) */}
        {S === "aktif" && isOwnerPA && (
          <Section title="Bagian 8 — Pengembalian & Penyelesaian (PA)" icon={RotateCcw}>
            <div className="space-y-3">
            <div>
              <h3 className="font-medium text-slate-700 mb-2">Pengembalian (Tunda)</h3>
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
                <Button variant="outline" onClick={doReturn} busy={busy}>
                  <RotateCcw size={16} /> Kembalikan (Tunda)
                </Button>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <Button onClick={() => run(() => completePermit(id), "Pekerjaan selesai.")} busy={busy}>
                <CheckCheck size={16} /> Selesaikan Pekerjaan
              </Button>
            </div>
            </div>
          </Section>
        )}

        {/* S16: IA revalidasi (Bagian 8 — Revalidasi, saat ditunda) — form terpisah dari Pengembalian PA */}
        {S === "ditunda" && hasRole("IA") && (
          <Section title="Bagian 8 — Revalidasi (IA)" icon={RefreshCw}>
            <div className="space-y-2">
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
              <Button onClick={doRevalidate} busy={busy}>
                <RefreshCw size={16} /> Kirim Revalidasi ke PA
              </Button>
            </div>
            </div>
          </Section>
        )}

        {/* S17: IA tutup (saat selesai) */}
        {S === "selesai" && hasRole("IA") && (
          <div className="bg-white rounded-xl shadow p-6">
            <Button variant="danger" onClick={() => run(() => closePermit(id), "Izin ditutup.")} busy={busy}>
              <Lock size={16} /> Tutup Izin
            </Button>
          </div>
        )}

        {/* S18: SPV live audit (saat aktif) */}
        {S === "aktif" && hasRole("SPV") && (
          <Section title="Live Audit (Supervisor)" icon={ClipboardCheck}>
            <div className="space-y-2">
            <textarea value={catatanAudit} onChange={(e) => setCatatanAudit(e.target.value)} rows={2}
              placeholder="Catatan temuan (opsional)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
            <Button onClick={() => run(() => addLiveAudit(id, catatanAudit || null), "Live audit tercatat.")} busy={busy}>
              Catat Live Audit
            </Button>
            </div>
          </Section>
        )}

        {/* Riwayat live audit */}
        {permit.live_audits?.length > 0 && (
          <Section title="Riwayat Live Audit" icon={ClipboardCheck}>
            <ul className="text-sm text-slate-600 space-y-1">
              {permit.live_audits.map((a) => (
                <li key={a.id} className="border-b border-slate-100 py-1">
                  <span className="text-slate-400">{a.tanggal} {a.jam}</span> — {a.auditor?.name ?? "-"}
                  {a.catatan ? `: ${a.catatan}` : ""}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Riwayat keluar-masuk ruang terbatas (khusus CSE) */}
        {permit.cse_access_logs?.length > 0 && (
          <Section title="Riwayat Masuk/Keluar Ruang Terbatas (Bagian 7 — CSE)" icon={History}>
            <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-1.5 font-medium">Personel</th>
                  <th className="text-left px-3 py-1.5 font-medium">Tanggal</th>
                  <th className="text-left px-3 py-1.5 font-medium">Masuk</th>
                  <th className="text-left px-3 py-1.5 font-medium">Keluar</th>
                  <th className="text-left px-3 py-1.5 font-medium">Dicatat oleh</th>
                </tr>
              </thead>
              <tbody>
                {permit.cse_access_logs.map((l) => (
                  <tr key={l.id} className="border-t border-slate-100">
                    <td className="px-3 py-1.5">
                      {l.nama_pekerja}
                      {l.catatan ? <span className="text-slate-400"> — {l.catatan}</span> : null}
                    </td>
                    <td className="px-3 py-1.5 text-slate-500">{l.tanggal}</td>
                    <td className="px-3 py-1.5">{l.jam_masuk ?? "-"}</td>
                    <td className="px-3 py-1.5">
                      {l.jam_keluar
                        ? l.jam_keluar
                        : <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Masih di dalam</span>}
                    </td>
                    <td className="px-3 py-1.5 text-slate-500">{l.dicatat_oleh?.name ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* Riwayat naik/turun (khusus WAH) */}
        {permit.wah_access_logs?.length > 0 && (
          <Section title="Riwayat Naik/Turun (Bagian 7 — WAH)" icon={History}>
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
          </Section>
        )}

        {/* Riwayat Pengembalian & Revalidasi (Bagian 8) */}
        {permit.revalidations?.length > 0 && (
          <Section title="Riwayat Pengembalian & Revalidasi" icon={RotateCcw}>
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
          </Section>
        )}

        {/* Riwayat status */}
        {permit.status_histories?.length > 0 && (
          <Section title="Riwayat Status" icon={History}>
            <ul className="text-sm text-slate-600 space-y-1">
              {permit.status_histories.map((h) => (
                <li key={h.id} className="flex items-center gap-2">
                  <StatusBadge status={h.status} /> <span className="text-slate-400">{fmt(h.changed_at)}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </div>
  );
}
