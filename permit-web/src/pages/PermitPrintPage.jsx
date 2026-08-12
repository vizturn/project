import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPermit } from "../services/permitService";
import { toast } from "sonner";

/**
 * Lembar cetak PTW — replikasi formulir manual EMP (persis layout & warna).
 * Read-only, data izin nyata. Untuk izin terbit (aktif/selesai/closed).
 *
 * Template per JENIS (warna & judul berbeda):
 *   HWP  → merah marun   (EMP-SHE-FOM-00.016) — "Pekerjaan Panas"
 *   CWP  → biru navy      (EMP-SHE-FOM-00.017) — "Pekerjaan Dingin"
 *   CSE  → coklat/oranye  (EMP-SHE-FOM-00.018) — "Confined Space Entry"
 *   WAH  → abu-abu gelap  (EMP-SHE-FOM-00.023) — "Work at Height"
 *
 * Tahap ini: HWP/CWP (Bagian 1-11 lengkap seperti manual). CSE & WAH menyusul.
 * TTD = digital (nama + timestamp) bila ada data; kolom kosong bila belum ada.
 */

// Konfigurasi tema per jenis izin.
const TEMA = {
  HWP: { warna: "#7a1f2b", judul: "Permit to Work (PTW)", sub: "Pekerjaan Panas – berpotensi percikan api", fom: "EMP-SHE-FOM-00.016" },
  CWP: { warna: "#1f3a5f", judul: "Permit to Work (PTW)", sub: "Pekerjaan Dingin – tanpa sumber api dan listrik", fom: "EMP-SHE-FOM-00.017" },
  CSE: { warna: "#b5581f", judul: "Confined Space Entry Permit", sub: "Hanya untuk masuk dan melakukan inspeksi", fom: "EMP-SHE-FOM-00.018" },
  WAH: { warna: "#3f3f46", judul: "Work at Height Permit (WAH)", sub: "Untuk akses ke lokasi kerja di ketinggian 1,8 m (6 feet) atau lebih", fom: "EMP-SHE-FOM-00.023" },
};

// Daftar PSB & bahaya PER JENIS (sesuai form manual masing-masing).
// HWP (FOM-00.016) & CWP (FOM-00.017) punya sedikit perbedaan item.
const PSB_PER_JENIS = {
  HWP: [
    ["PSB-1", "Memasuki Ruang Terbatas"], ["PSB-2", "Pembukaan Isolasi"], ["PSB-3", "Berkendara (mengemudi)"],
    ["PSB-4", "Isolasi Energi"], ["PSB-6", "Pekerjaan Panas"], ["PSB-7", "Sistem Listrik Beraliran / Hidup"],
    ["PSB-8", "Angkutan Orang"], ["PSB-9", "Pengangkatan Mekanis"], ["PSB-10", "Penanganan Tubular"],
    ["PSB-11", "Bekerja di sekitar Peralatan Bergerak"], ["PSB-12", "Bekerja di Dekat Air"], ["PSB-13", "Bekerja di Ketinggian"],
  ],
  CWP: [
    ["PSB-1", "Memasuki Ruang Terbatas"], ["PSB-2", "Pembukaan Isolasi"], ["PSB-4", "Isolasi Energi"],
    ["PSB-5", "Penggalian"], ["PSB-6", "Pekerjaan Panas"], ["PSB-8", "Angkutan Orang"],
    ["PSB-9", "Pengangkatan Mekanis"], ["PSB-10", "Penanganan Tubular"], ["PSB-11", "Bekerja di sekitar Peralatan Bergerak"],
    ["PSB-12", "Bekerja di Dekat Air"], ["PSB-13", "Bekerja di Ketinggian"],
  ],
  CSE: [
    ["PSB-1", "Memasuki Ruang Terbatas"], ["PSB-2", "Pembukaan Isolasi"], ["PSB-4", "Isolasi Energi"],
    ["PSB-6", "Pekerjaan Panas"], ["PSB-7", "Sistem Listrik Beraliran / Hidup"], ["PSB-8", "Angkutan Orang"],
    ["PSB-11", "Bekerja di sekitar Peralatan Bergerak"], ["PSB-12", "Bekerja di Dekat Air"], ["PSB-13", "Bekerja di Ketinggian"],
  ],
  WAH: [
    ["PSB-1", "Memasuki Ruang Terbatas"], ["PSB-2", "Pembukaan Isolasi"], ["PSB-4", "Isolasi Energi"],
    ["PSB-6", "Pekerjaan Panas"], ["PSB-7", "Sistem Listrik Beraliran / Hidup"], ["PSB-8", "Angkutan Orang"],
    ["PSB-11", "Bekerja di sekitar Peralatan Bergerak"], ["PSB-12", "Bekerja di Dekat Air / Lumpur"], ["PSB-13", "Bekerja di Ketinggian"],
  ],
};

const BAHAYA_PER_JENIS = {
  HWP: [
    "Confined Space/ruang terbatas", "Akses keluar/masuk yang sulit", "Cuaca buruk",
    "Hot surface/permukaan panas", "Bahan berbahaya (chemicals, explosives)", "Vibration/getaran",
    "SIMOPS", "Manual Handling", "Bekerja di luar pembatas",
    "Benda melenting (proyektil)", "Dropped object/benda terjatuh", "Gas beracun (H2S, CO2)",
    "Noise/kebisingan", "Perkakas (hand-tools, power tools)", "Tergelincir, terpeleset, tersandung",
    "Bukaan tanpa pelindung", "Tekanan tinggi", "Heat stress/pajanan panas",
    "Flammables/bahan-bahan mudah terbakar", "Spark/percikan bunga api", "Benda bergerak",
  ],
  CWP: [
    "Confined Space/ruang terbatas", "Akses keluar/masuk yang sulit", "Cuaca buruk",
    "Hot surface/permukaan panas", "Bahan berbahaya (chemicals, explosives)", "Vibration/getaran",
    "SIMOPS", "Manual Handling", "Bekerja di luar pembatas",
    "Benda melenting (proyektil)", "Dropped object/benda terjatuh", "Gas beracun (H2S, CO2)",
    "Noise/kebisingan", "Perkakas (hand-tools, power tools)", "Tergelincir, terpeleset, tersandung",
    "Bukaan tanpa pelindung", "Tekanan tinggi", "Heat stress/pajanan panas",
    "Rigging, Lifting", "Benda tajam/abrasif", "Benda bergerak",
  ],
};

export default function PermitPrintPage() {
  const { id } = useParams();
  const [permit, setPermit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPermit(id)
      .then((res) => setPermit(res.data.data))
      .catch(() => toast.error("Gagal memuat izin."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#666" }}>Memuat...</div>;
  if (!permit) return null;

  const jenis = permit.permit_types?.length ? permit.permit_types : permit.permit_type ? [permit.permit_type] : [];
  const kodeUtama = jenis.find((t) => TEMA[t.kode])?.kode || "HWP";
  const tema = TEMA[kodeUtama];
  const daftarPsb = PSB_PER_JENIS[kodeUtama] || PSB_PER_JENIS.HWP;
  const daftarBahaya = BAHAYA_PER_JENIS[kodeUtama] || BAHAYA_PER_JENIS.HWP;

  const fmt = (d) => (d ? new Date(d).toLocaleString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
  const fmtTgl = (d) => (d ? new Date(d).toLocaleDateString("id-ID") : "");
  const fmtJam = (d) => (d ? new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "");

  const bahayaDipilih = new Set((permit.hazards || []).map((h) => Number(h.no_bahaya)));
  const psbDipilih = new Set((permit.psb_forms || []).map((f) => f.psb_type?.kode).filter(Boolean));
  const risiko = permit.tingkat_risiko;

  // CSE punya struktur berbeda (Persiapan ruang terbatas + tabel gas khusus).
  const isCSE = kodeUtama === "CSE";
  const cseParalatan = new Set(permit.cse_peralatan || []);
  const PERALATAN_CSE = [
    ["escape_harness_tripod", "Escape harness, line & tripod"],
    ["breathing_apparatus", "Breathing apparatus"],
    ["stretcher_ambulance", "Stretcher, ambulance"],
    ["medic_first_aid", "Medic, First Aid Kit"],
    ["fire_extinguisher", "Fire extinguishers"],
    ["ventilasi_mekanis", "Ventilasi mekanis"],
  ];
  const gasAwal = (permit.gas_tests || []).filter((g) => g.fase === "awal");
  const gasLanjutan = (permit.gas_tests || []).filter((g) => g.fase !== "awal");

  // WAH punya bagian khusus (daftar pekerja + pelatihan, peralatan ketinggian).
  const isWAH = kodeUtama === "WAH";
  const wahParalatan = new Set(permit.wah_peralatan || []);
  const PERALATAN_WAH = [
    ["full_body_harness", "Full body harness"],
    ["barrier", "Barrier di sekitar lokasi kerja"],
    ["double_lanyard", "Double lanyard"],
    ["medic", "Medic, first aider, first aid kit"],
    ["anchor_point", "Anchor Point yang disetujui"],
    ["ambulance", "Ambulance"],
  ];
  const wahWorkers = permit.wah_workers || [];

  // Bagian 9 & 10: ambil waktu dari riwayat status (cara b).
  const histSelesai = (permit.status_histories || []).find((h) => h.status === "selesai");
  const histClosed = (permit.status_histories || []).find((h) => h.status === "closed");

  // TTD digital: tampilkan nama + timestamp bila ada.
  const ttdDigital = (nama, waktu) =>
    nama ? (
      <>
        <div style={{ fontWeight: 700 }}>{nama}</div>
        {waktu && <div style={{ fontSize: 8, color: "#555" }}>Ditandatangani digital · {fmt(waktu)}</div>}
      </>
    ) : "";

  return (
    <div className="ptw-root">
      <style>{`
        .ptw-root { --tema: ${tema.warna}; background:#eee; min-height:100vh; padding:20px; }
        .ptw-tb { max-width:860px; margin:0 auto 14px; display:flex; gap:8px; justify-content:flex-end; }
        .ptw-b { padding:8px 16px; border-radius:8px; border:none; font-size:14px; font-weight:600; cursor:pointer; }
        .ptw-b-p { background:var(--tema); color:#fff; }
        .ptw-b-k { background:#ddd; color:#333; }
        .sheet { max-width:860px; margin:0 auto; background:#fff; padding:26px 30px; font-family:Arial,Helvetica,sans-serif; color:#111; font-size:10.5px; box-shadow:0 1px 4px rgba(0,0,0,.15); }
        .hd { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
        .hd-title { font-size:19px; font-weight:800; color:#111; margin:0; }
        .hd-sub { font-size:11px; color:#333; margin:1px 0 0; }
        .hd-logo { font-size:30px; font-weight:800; color:var(--tema); font-style:italic; line-height:1; }
        .hd-nomor { display:flex; align-items:center; gap:6px; margin-top:2px; }
        .hd-nomor-l { font-size:11px; color:#333; }
        .hd-nomor-b { border:1.5px solid #333; padding:2px 14px; font-size:15px; font-weight:700; letter-spacing:1px; min-width:120px; }
        .fom { font-size:8px; color:#666; text-align:right; }
        .sec { background:var(--tema); color:#fff; font-weight:700; font-size:11.5px; padding:3px 8px; margin-top:8px; }
        .sec small { font-weight:400; font-size:9.5px; opacity:.92; }
        .tbl { width:100%; border-collapse:collapse; border:1px solid var(--tema); }
        .tbl td, .tbl th { border:1px solid #bbb; padding:4px 6px; vertical-align:top; font-size:10px; }
        .lbl { font-size:8px; color:#555; text-transform:uppercase; display:block; margin-bottom:2px; letter-spacing:.3px; }
        .val { font-size:10.5px; min-height:14px; }
        .chk-wrap { border:1px solid var(--tema); border-top:none; padding:6px 8px; display:grid; grid-template-columns:1fr 1fr 1fr; gap:3px 14px; }
        .chk { display:flex; align-items:flex-start; gap:5px; font-size:9.5px; line-height:1.25; }
        .box { width:11px; height:11px; border:1.2px solid #444; flex-shrink:0; display:inline-flex; align-items:center; justify-content:center; font-size:9px; margin-top:1px; }
        .box.on { background:var(--tema); border-color:var(--tema); color:#fff; }
        .box.on::after { content:"✓"; }
        .sign-td { height:44px; }
        .foot { margin-top:12px; font-size:8px; color:#666; display:flex; justify-content:space-between; border-top:1px solid #ddd; padding-top:5px; }
        .note { font-size:8px; color:#888; text-align:center; margin-top:8px; }
        @media print {
          .ptw-root { background:#fff; padding:0; }
          .ptw-tb { display:none; }
          .sheet { box-shadow:none; max-width:100%; padding:8mm; }
          @page { size:A4; margin:6mm; }
          .box.on { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
          .sec { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        }
      `}</style>

      <div className="ptw-tb">
        <button className="ptw-b ptw-b-k" onClick={() => window.history.back()}>← Kembali</button>
        <button className="ptw-b ptw-b-p" onClick={() => window.print()}>🖨 Cetak / Simpan PDF</button>
      </div>

      <div className="sheet">
        {/* HEADER */}
        <div className="hd">
          <div>
            <h1 className="hd-title">{tema.judul}</h1>
            <p className="hd-sub">{tema.sub}</p>
            <div className="hd-nomor">
              <span className="hd-nomor-l">Nomor PTW</span>
              <span className="hd-nomor-b">{permit.nomor_izin}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="hd-logo">emp</div>
            <div className="fom">{tema.fom}</div>
          </div>
        </div>

        {/* 1. URAIAN PEKERJAAN */}
        <div className="sec">1. Uraian Pekerjaan <small>(dilengkapi oleh performing authority - PA)</small></div>
        <table className="tbl">
          <tbody>
            <tr>
              <td style={{ width: "33%" }}><span className="lbl">Tanggal diminta</span><span className="val">{fmtTgl(permit.created_at)}</span></td>
              <td style={{ width: "34%" }}><span className="lbl">Diminta oleh (nama & ttd)</span><span className="val">{permit.performing_authority?.name ?? ""}</span></td>
              <td><span className="lbl">Lead / Supervisor (nama & ttd)</span><span className="val"></span></td>
            </tr>
            <tr>
              <td><span className="lbl">Lokasi Pekerjaan</span><span className="val">{permit.lokasi ?? ""}</span></td>
              <td><span className="lbl">Equipment ID</span><span className="val"></span></td>
              <td><span className="lbl">Lamanya pengerjaan (estimasi)</span><span className="val">{permit.durasi ? `${permit.durasi} jam` : ""}</span></td>
            </tr>
            <tr>
              <td colSpan={2}><span className="lbl">Deskripsi pekerjaan</span><span className="val">{permit.deskripsi_pekerjaan ?? ""}</span></td>
              <td><span className="lbl">Approval Authority</span><span className="val">{permit.approval_authority?.name ?? ""}</span>
                <div style={{ fontSize: 8, color: "#666", marginTop: 4 }}>PTW disetujui. Pekerjaan dapat dimulai setelah penerbitan oleh IA</div></td>
            </tr>
            <tr>
              <td><span className="lbl">Reference WO</span><span className="val"></span></td>
              <td colSpan={2}><span className="lbl">Reference PTW</span><span className="val"></span></td>
            </tr>
          </tbody>
        </table>

        {/* 2. PSB */}
        <div className="sec">2. Formulir PSB (Life-Saving Rules) <small>(ditetapkan oleh Approval Authority - AA, dilaksanakan oleh PA)</small></div>
        <div className="chk-wrap">
          {daftarPsb.map(([k, label]) => (
            <span className="chk" key={k}><span className={"box" + (psbDipilih.has(k) ? " on" : "")} /><span><b>{k}</b> &nbsp;{label}</span></span>
          ))}
        </div>

        {/* 3. IDENTIFIKASI BAHAYA */}
        {!isCSE && !isWAH && <>
        <div className="sec">3. Identifikasi Bahaya dan Pengendalian <small>(dilengkapi oleh PA dan diperiksa Issuing Authority - IA)</small></div>
        <div style={{ border: "1px solid var(--tema)", borderTop: "none", padding: "4px 8px 0", fontSize: 9, fontWeight: 700 }}>Bahaya-bahaya (tandai yang sesuai)</div>
        <div className="chk-wrap" style={{ borderTop: "none" }}>
          {daftarBahaya.map((label, i) => {
            const no = i + 1;
            return <span className="chk" key={no}><span className={"box" + (bahayaDipilih.has(no) ? " on" : "")} /><span>{String(no).padStart(2, "0")} &nbsp;{label}</span></span>;
          })}
        </div>
        <table className="tbl" style={{ borderTop: "none" }}>
          <tbody>
            <tr><td colSpan={3}><span className="lbl">Uraikan bahaya-bahaya lainnya</span><span className="val">{permit.bahaya_lainnya ?? ""}</span></td></tr>
            <tr>
              <td style={{ width: "40%" }}><span className="lbl">Nomor Job Safety Analysis (JSA)</span><span className="val">{permit.nomor_jsa ?? ""}</span></td>
              <td colSpan={2}>
                <span className="lbl">Tingkat risiko keseluruhan berdasarkan JSA</span>
                <span style={{ display: "inline-flex", gap: 16 }}>
                  <span className="chk"><span className={"box" + (risiko === "tinggi" ? " on" : "")} /> Tinggi</span>
                  <span className="chk"><span className={"box" + (risiko === "sedang" ? " on" : "")} /> Sedang</span>
                  <span className="chk"><span className={"box" + (risiko === "rendah" ? " on" : "")} /> Rendah</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 4. REFERENSI PENDUKUNG */}
        <div className="sec">4. Referensi Pendukung <small>(dilengkapi oleh IA)</small></div>
        <table className="tbl">
          <tbody>
            <tr>
              <td colSpan={2} style={{ textAlign: "center", fontWeight: 700, background: "#f3f3f3" }}>Permit Lainnya <span style={{ fontWeight: 400, fontSize: 8 }}>(tulis nomor)</span></td>
              <td colSpan={3} style={{ textAlign: "center", fontWeight: 700, background: "#f3f3f3" }}>Certificates <span style={{ fontWeight: 400, fontSize: 8 }}>(tulis nomor)</span></td>
            </tr>
            <tr style={{ fontSize: 8, color: "#555" }}>
              <td style={{ width: "20%" }}>Confined Space Entry</td>
              <td style={{ width: "20%" }}>Bekerja di Ketinggian</td>
              <td style={{ width: "20%" }}>Isolation</td>
              <td style={{ width: "20%" }}>Scaffolding</td>
              <td style={{ width: "20%" }}>Excavation</td>
            </tr>
            <tr>
              <td><span className="val">{permit.ref_permit_cse ?? ""}</span></td>
              <td><span className="val">{permit.ref_permit_wah ?? ""}</span></td>
              <td><span className="val">{permit.cert_isolation_diperlukan ? (permit.cert_isolation ?? "✓") : ""}</span></td>
              <td><span className="val">{permit.cert_scaffolding_diperlukan ? (permit.cert_scaffolding ?? "✓") : ""}</span></td>
              <td><span className="val">{permit.cert_excavation_diperlukan ? (permit.cert_excavation ?? "✓") : ""}</span></td>
            </tr>
            <tr><td colSpan={5}><span className="lbl">Sistem Safety di-non-aktifkan</span><span className="val">{permit.sistem_safety_dinonaktifkan ?? ""}</span></td></tr>
            <tr><td colSpan={5}><span className="lbl">Referensi lainnya (MSDS, Lifting Plan, Prosedur, dll)</span><span className="val">{permit.referensi_lainnya ?? ""}</span></td></tr>
          </tbody>
        </table>

        {/* 5. PENGUJIAN KADAR GAS */}
        <div className="sec">5. Pengujian Kadar Gas <small>(dilaksanakan oleh IA atau Authorized Gas Tester - AGT)</small></div>
        <table className="tbl">
          <tbody>
            <tr>
              <td style={{ width: "34%", verticalAlign: "middle", fontSize: 9.5 }}>
                <b>IA</b> menetapkan bahwa pengetesan kadar gas berikut ini harus dilaksanakan oleh petugas <b>Authorized Gas Tester (AGT)</b> dan meminta pengetesan ulang dilakukan dengan periode berikut [{permit.gas_periode_ulang ?? "……"}] dan hasilnya dicatat pada lembar gas test di belakang permit ini.
              </td>
              <td style={{ width: "34%", padding: 0 }}>
                <div style={{ textAlign: "center", fontWeight: 700, padding: "3px", borderBottom: "1px solid #bbb" }}>Hasil Pengetesan Gas Awal</div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr><td style={{ border: "1px solid #ccc", padding: "3px 5px" }}><span className={"box" + (permit.gas_uji_flammable ? " on" : "")} /> Flammable</td><td style={{ border: "1px solid #ccc", padding: "3px 5px", width: 40 }}></td><td style={{ border: "1px solid #ccc", padding: "3px 5px", width: 44 }}>%LEL</td></tr>
                    <tr><td style={{ border: "1px solid #ccc", padding: "3px 5px" }}><span className={"box" + (permit.gas_uji_oksigen ? " on" : "")} /> Oksigen</td><td style={{ border: "1px solid #ccc" }}></td><td style={{ border: "1px solid #ccc", padding: "3px 5px" }}>%</td></tr>
                    <tr><td style={{ border: "1px solid #ccc", padding: "3px 5px" }}><span className={"box" + (permit.gas_uji_beracun ? " on" : "")} /> Beracun</td><td style={{ border: "1px solid #ccc" }}></td><td style={{ border: "1px solid #ccc", padding: "3px 5px" }}>ppm</td></tr>
                  </tbody>
                </table>
              </td>
              <td style={{ verticalAlign: "middle", fontSize: 9.5, textAlign: "center" }}>
                Saya, petugas AGT menyatakan bahwa hasil pengetesan gas masih dalam <u>batas aman</u> untuk melaksanakan pekerjaan
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 700, textAlign: "center" }}>Authorized Gas Tester</td>
              <td colSpan={2} style={{ padding: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
                  <tbody>
                    <tr style={{ fontSize: 8, color: "#555" }}><td style={{ border: "1px solid #ccc", padding: 3 }}>Nama</td><td style={{ border: "1px solid #ccc" }}>Ttd</td><td style={{ border: "1px solid #ccc" }}>Tanggal</td><td style={{ border: "1px solid #ccc" }}>Jam</td></tr>
                    <tr className="sign-td">
                      <td style={{ border: "1px solid #ccc" }}>{permit.gas_tests?.[0]?.agt?.name ?? ""}</td>
                      <td style={{ border: "1px solid #ccc" }}></td>
                      <td style={{ border: "1px solid #ccc" }}>{permit.gas_tests?.[0]?.tanggal ?? ""}</td>
                      <td style={{ border: "1px solid #ccc" }}>{permit.gas_tests?.[0]?.jam ?? ""}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        </>}

        {/* 3 & 4 KHUSUS CSE: Persiapan Ruang Terbatas + Pengujian Gas */}
        {isCSE && <>
        <div className="sec">3. Persiapan <small>(dilengkapi bersama oleh Issuing Authority - IA dan Performing Authority - PA)</small></div>
        <table className="tbl">
          <tbody>
            <tr>
              <td style={{ width: "38%", fontSize: 9 }}>IA telah mengevaluasi sistem yang berkaitan dengan ruang terbatas, apakah memerlukan <b>ISOLASI ENERGI</b></td>
              <td style={{ width: "28%" }}>
                <span className="chk"><span className={"box" + (permit.cse_isolasi_diperlukan ? " on" : "")} /> Diperlukan</span>
                <span className="chk" style={{ marginTop: 3 }}><span className={"box" + (permit.cse_isolasi_diperlukan === false ? " on" : "")} /> Tidak diperlukan</span>
              </td>
              <td><span className="lbl">Sertifikat Isolasi (nomor & lampiran)</span><span className="val">{permit.cse_isolasi_cert_nomor ?? ""}</span></td>
            </tr>
            <tr>
              <td style={{ fontSize: 9 }}><b>PA</b> telah melakukan identifikasi bahaya dan penilaian risiko <b>memasuki</b> dan <b>bekerja</b> di dalam ruang terbatas</td>
              <td><span className="lbl">Nomor JSA (lampirkan)</span><span className="val">{permit.nomor_jsa ?? ""}</span></td>
              <td style={{ fontSize: 8, color: "#555" }}>Memasuki ruang terbatas adalah aktivitas berbahaya. PA & IA harus memastikan setiap langkah mitigasi yang tertuang dalam JSA ada dan dilaksanakan.</td>
            </tr>
            <tr>
              <td style={{ fontSize: 9 }}><b>PA</b> telah menetapkan petugas jaga di luar ruang terbatas, yang mencatat pekerja yang masuk dan menghitung waktu pekerja di dalam ruang terbatas</td>
              <td><span className="lbl">Nama Petugas Jaga</span><span className="val">{permit.cse_petugas_jaga?.name ?? permit.cse_petugas_jaga_nama ?? ""}</span></td>
              <td><span className="lbl">Peralatan komunikasi digunakan</span><span className="val">{permit.cse_alat_komunikasi ?? ""}</span></td>
            </tr>
            <tr>
              <td style={{ fontSize: 9 }}><b>PA</b> telah mempersiapkan peralatan khusus, rencana evakuasi darurat dari dalam ruang terbatas, dan diverifikasi oleh <b>IA</b></td>
              <td colSpan={2}>
                <div style={{ fontSize: 8, color: "#555", marginBottom: 4 }}>Peralatan khusus yang diperlukan dan IA telah memeriksa ketersediaannya di lokasi</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px" }}>
                  {PERALATAN_CSE.map(([kode, label]) => (
                    <span className="chk" key={kode}><span className={"box" + (cseParalatan.has(kode) ? " on" : "")} /> {label}</span>
                  ))}
                  <span className="chk"><span className="box" /> Lainnya: {permit.cse_peralatan_lainnya ?? ""}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="sec">4. Pengujian Kadar Gas <small>(diminta oleh IA dan dilaksanakan oleh Authorized Gas Tester - AGT)</small></div>
        <table className="tbl">
          <tbody>
            <tr style={{ fontSize: 8, color: "#555", fontWeight: 700, background: "#f3f3f3", textAlign: "center" }}>
              <td style={{ width: "22%" }}>Kadar Gas Diuji</td>
              <td style={{ width: "22%" }}>Batasan yang diizinkan</td>
              <td>Hasil Pengujian Awal</td>
              <td>Pengujian Lanjutan</td>
            </tr>
            {[
              ["Oksigen", "19.5% - 23.5%", "oksigen"],
              ["%LEL", "<10%", "lel"],
              ["Karbon Monoksida", "< 35 ppm (8 jam)", "co_ppm"],
              ["Hidrogen Sulfida", "< 10 ppm (8 jam)", "h2s"],
            ].map(([nama, batas, field]) => (
              <tr key={field}>
                <td style={{ fontWeight: 700, fontSize: 9 }}>{nama}</td>
                <td style={{ fontSize: 9 }}>{batas}</td>
                <td>{gasAwal[0]?.[field] ?? ""}</td>
                <td>{gasLanjutan.map((g) => g[field]).filter(Boolean).join(" · ")}</td>
              </tr>
            ))}
            <tr>
              <td style={{ fontWeight: 700, fontSize: 9 }}>Petugas AGT</td>
              <td colSpan={3} style={{ fontSize: 9 }}>
                Nama: {(permit.gas_tests || []).map((g) => g.agt?.name).filter(Boolean).join(", ") || ""}
              </td>
            </tr>
            <tr>
              <td colSpan={4} style={{ fontSize: 8, textAlign: "center", fontStyle: "italic" }}>
                Issuing Authority tidak mengizinkan memasuki ruang terbatas jika hasil pengujian awal menunjukkan kadar gas diuji di luar batas yang diizinkan
              </td>
            </tr>
          </tbody>
        </table>
        </>}

        {/* 3 KHUSUS WAH: Persiapan Bekerja di Ketinggian */}
        {isWAH && <>
        <div className="sec">3. Persiapan <small>(dilengkapi bersama oleh Issuing Authority - IA dan PA)</small></div>
        <table className="tbl">
          <tbody>
            <tr>
              <td style={{ width: "38%", fontSize: 9 }}>IA telah mengevaluasi sistem yang berkaitan dengan lokasi kerja di ketinggian, apakah memerlukan <b>ISOLASI ENERGI</b></td>
              <td style={{ width: "28%" }}>
                <span className="chk"><span className={"box" + (permit.wah_isolasi_diperlukan ? " on" : "")} /> Diperlukan</span>
                <span className="chk" style={{ marginTop: 3 }}><span className={"box" + (permit.wah_isolasi_diperlukan === false ? " on" : "")} /> Tidak diperlukan</span>
              </td>
              <td><span className="lbl">Sertifikat Isolasi (nomor & lampiran)</span><span className="val">{permit.wah_isolasi_cert_nomor ?? ""}</span></td>
            </tr>
            <tr>
              <td style={{ fontSize: 9 }}><b>PA</b> telah melakukan identifikasi bahaya dan penilaian risiko <b>bekerja di ketinggian</b></td>
              <td><span className="lbl">Nomor JSA (nomor & lampirkan)</span><span className="val">{permit.nomor_jsa ?? ""}</span></td>
              <td style={{ fontSize: 8, color: "#555" }}>Bekerja di ketinggian adalah aktivitas berbahaya. PA & IA harus memastikan setiap langkah mitigasi yang tertuang dalam JSA ada dan dilaksanakan.</td>
            </tr>
          </tbody>
        </table>
        {/* Daftar pekerja + pelatihan */}
        <table className="tbl" style={{ borderTop: "none" }}>
          <tbody>
            <tr style={{ background: "#f3f3f3", fontWeight: 700, textAlign: "center", fontSize: 9 }}>
              <td style={{ width: "60%" }}>Nama Pekerja</td>
              <td>Telah Mengikuti Pelatihan Bekerja di Ketinggian</td>
            </tr>
            {(wahWorkers.length === 0 ? [null, null, null] : wahWorkers).map((w, i) => (
              <tr className="sign-td" key={i}>
                <td style={{ fontSize: 9 }}>{w?.nama_pekerja ?? ""}</td>
                <td style={{ textAlign: "center" }}>
                  <span className="chk" style={{ display: "inline-flex", marginRight: 16 }}><span className={"box" + (w?.sudah_pelatihan === true ? " on" : "")} /> Ya</span>
                  <span className="chk" style={{ display: "inline-flex" }}><span className={"box" + (w?.sudah_pelatihan === false ? " on" : "")} /> Tidak</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Peralatan khusus ketinggian */}
        <table className="tbl" style={{ borderTop: "none" }}>
          <tbody>
            <tr><td colSpan={2} style={{ fontSize: 8, color: "#555" }}>Peralatan khusus yang diperlukan dan IA telah memeriksa kelayakan peralatan dan ketersediaan di Lokasi (diperiksa oleh Issuing Authority)</td></tr>
            <tr>
              <td style={{ width: "50%", padding: "6px 8px" }}>
                {PERALATAN_WAH.slice(0, 3).map(([kode, label]) => (
                  <div className="chk" key={kode} style={{ marginBottom: 3 }}><span className={"box" + (wahParalatan.has(kode) ? " on" : "")} /> {label}</div>
                ))}
                <div className="chk"><span className={"box" + (permit.wah_peralatan_lainnya ? " on" : "")} /> Lainnya: {permit.wah_peralatan_lainnya ?? ""}</div>
              </td>
              <td style={{ width: "50%", padding: "6px 8px" }}>
                {PERALATAN_WAH.slice(3).map(([kode, label]) => (
                  <div className="chk" key={kode} style={{ marginBottom: 3 }}><span className={"box" + (wahParalatan.has(kode) ? " on" : "")} /> {label}</div>
                ))}
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ fontSize: 9 }}>
                <b>Jika menggunakan perancah, PA melampirkan Scaffolding Certificate</b>
                {"  "}<span style={{ color: "#555" }}>(nomor)</span>: {permit.wah_scaffolding_cert_nomor ?? ""}
              </td>
            </tr>
          </tbody>
        </table>
        </>}

        {/* 6 & 7 PENERBITAN + PENERIMAAN */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
          <tbody>
            <tr>
              <td style={{ width: "50%", padding: 0, verticalAlign: "top" }}>
                <div className="sec" style={{ marginTop: 0 }}>6. Penerbitan <small>(dilakukan oleh IA)</small></div>
                <div style={{ border: "1px solid var(--tema)", borderTop: "none", padding: 6, fontSize: 9, fontStyle: "italic", minHeight: 44 }}>
                  Saya, <b>IA</b> menyatakan bahwa semua bahaya telah diidentifikasi, semua tindakan pencegahan telah dilakukan dan kondisi aman untuk melaksanakan pekerjaan yang tertuang dalam PTW ini.
                </div>
                <table className="tbl" style={{ borderTop: "none" }}><tbody>
                  <tr className="sign-td"><td style={{ width: "40%" }}>{ttdDigital(permit.issuing_authority?.name, permit.tgl_terbit)}</td><td>{/* ttd */}</td><td style={{ width: "22%" }}>{fmtTgl(permit.tgl_terbit)}</td><td style={{ width: "18%" }}>{fmtJam(permit.tgl_terbit)}</td></tr>
                  <tr style={{ fontSize: 8, color: "#555", textAlign: "center" }}><td>Nama</td><td>Tanda tangan</td><td>Tanggal</td><td>Jam</td></tr>
                </tbody></table>
              </td>
              <td style={{ width: "50%", padding: "0 0 0 6px", verticalAlign: "top" }}>
                <div className="sec" style={{ marginTop: 0 }}>7. Penerimaan PTW <small>(dilakukan oleh PA)</small></div>
                <div style={{ border: "1px solid var(--tema)", borderTop: "none", padding: 6, fontSize: 9, fontStyle: "italic", minHeight: 44 }}>
                  Saya, <b>PA</b> telah membaca dan memahami semua kondisi dalam PTW ini dan lampirannya. Saya menerima tanggung jawab pelaksanaan pekerjaan sesuai PTW ini.
                </div>
                <table className="tbl" style={{ borderTop: "none" }}><tbody>
                  <tr className="sign-td"><td style={{ width: "40%" }}>{ttdDigital(permit.performing_authority?.name, permit.diterima_pa_at)}</td><td></td><td style={{ width: "22%" }}>{fmtTgl(permit.diterima_pa_at)}</td><td style={{ width: "18%" }}>{fmtJam(permit.diterima_pa_at)}</td></tr>
                  <tr style={{ fontSize: 8, color: "#555", textAlign: "center" }}><td>Nama</td><td>Tanda tangan</td><td>Tanggal</td><td>Jam</td></tr>
                </tbody></table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* 8. PENGEMBALIAN & REVALIDASI */}
        <div className="sec">8. Pengembalian dan Revalidasi <small>(dilakukan oleh PA dan IA)</small></div>
        <table className="tbl">
          <tbody>
            <tr style={{ background: "#f3f3f3", fontWeight: 700, textAlign: "center" }}>
              <td colSpan={4}>Pengembalian <span style={{ fontWeight: 400, fontSize: 8 }}>(PTW ditunda)</span></td>
              <td colSpan={4}>Revalidasi <span style={{ fontWeight: 400, fontSize: 8 }}>(PTW diberlakukan kembali, setelah pemeriksaan oleh IA)</span></td>
            </tr>
            <tr style={{ fontSize: 8, color: "#555", textAlign: "center" }}>
              <td>PA (nama & ttd)</td><td>IA (nama & ttd)</td><td>Tanggal</td><td>Jam</td>
              <td>IA (nama & ttd)</td><td>PA (nama & ttd)</td><td>Tanggal</td><td>Jam</td>
            </tr>
            {(permit.revalidations || []).length === 0 ? (
              <tr className="sign-td"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
            ) : (
              permit.revalidations.map((r) => (
                <tr className="sign-td" key={r.id}>
                  <td style={{ fontSize: 9 }}>{r.returned_by?.name ?? ""}</td><td></td><td>{fmtTgl(r.returned_at)}</td><td>{fmtJam(r.returned_at)}</td>
                  <td style={{ fontSize: 9 }}>{r.revalidated_by?.name ?? ""}</td><td></td><td>{fmtTgl(r.revalidated_at)}</td><td>{fmtJam(r.revalidated_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 9, 10, 11 */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
          <tbody>
            <tr>
              <td style={{ width: "37%", padding: 0, verticalAlign: "top" }}>
                <div className="sec" style={{ marginTop: 0 }}>9. Penyelesaian <small>(oleh PA)</small></div>
                <div style={{ border: "1px solid var(--tema)", borderTop: "none", padding: 5, fontSize: 8, minHeight: 30 }}>
                  <b>PA</b> menyatakan pekerjaan telah dilaksanakan dengan baik. Pekerjaan [SELESAI / TIDAK SELESAI], area kerja ditinggalkan dalam keadaan aman dan bersih.
                </div>
                <table className="tbl" style={{ borderTop: "none" }}><tbody>
                  <tr className="sign-td"><td>{histSelesai ? (permit.performing_authority?.name ?? "") : ""}</td><td></td><td>{histSelesai ? fmtTgl(histSelesai.changed_at) : ""}</td><td>{histSelesai ? fmtJam(histSelesai.changed_at) : ""}</td></tr>
                  <tr style={{ fontSize: 7.5, color: "#555", textAlign: "center" }}><td>Nama</td><td>Ttd</td><td>Tgl</td><td>Jam</td></tr>
                </tbody></table>
              </td>
              <td style={{ width: "37%", padding: "0 0 0 5px", verticalAlign: "top" }}>
                <div className="sec" style={{ marginTop: 0 }}>10. Penutupan PTW <small>(oleh IA)</small></div>
                <div style={{ border: "1px solid var(--tema)", borderTop: "none", padding: 5, fontSize: 8, minHeight: 30 }}>
                  <b>IA</b> telah memeriksa pekerjaan dan menyatakan Pekerjaan [SELESAI / TIDAK SELESAI], area kerja ditinggalkan dalam keadaan aman dan bersih.
                </div>
                <table className="tbl" style={{ borderTop: "none" }}><tbody>
                  <tr className="sign-td"><td>{histClosed ? (permit.issuing_authority?.name ?? "") : ""}</td><td></td><td>{histClosed ? fmtTgl(histClosed.changed_at) : ""}</td><td>{histClosed ? fmtJam(histClosed.changed_at) : ""}</td></tr>
                  <tr style={{ fontSize: 7.5, color: "#555", textAlign: "center" }}><td>Nama</td><td>Ttd</td><td>Tgl</td><td>Jam</td></tr>
                </tbody></table>
              </td>
              <td style={{ padding: "0 0 0 5px", verticalAlign: "top" }}>
                <div className="sec" style={{ marginTop: 0 }}>11. Live Audit</div>
                <div style={{ border: "1px solid var(--tema)", borderTop: "none", padding: 5, fontSize: 8, minHeight: 30 }}>
                  Dilakukan oleh Supervisor atau lebih tinggi saat pekerjaan dilaksanakan.
                </div>
                <table className="tbl" style={{ borderTop: "none" }}><tbody>
                  {(permit.live_audits || []).length === 0 ? (
                    <tr className="sign-td"><td>{/* nama */}</td><td style={{ width: "30%" }}></td></tr>
                  ) : (
                    permit.live_audits.slice(0, 3).map((a) => (
                      <tr className="sign-td" key={a.id}><td style={{ fontSize: 8 }}>{a.auditor?.name ?? ""}</td><td style={{ fontSize: 8 }}>{a.tanggal} {a.jam}</td></tr>
                    ))
                  )}
                  <tr style={{ fontSize: 7.5, color: "#555", textAlign: "center" }}><td>Nama & ttd</td><td>Tgl / Jam</td></tr>
                </tbody></table>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="foot">
          <span>Asli – dipasang di tempat kerja</span>
          <span>Salinan Pink – dipasang di Control Room</span>
        </div>
        <div className="note">
          Dokumen dihasilkan digital oleh Sistem Digital Permit SHE — EMP Bentu Limited · Status: {permit.status?.toUpperCase()} · Dicetak: {fmt(new Date().toISOString())}
        </div>
      </div>
    </div>
  );
}
