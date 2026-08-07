import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPermit } from "../services/permitService";
import { toast } from "sonner";

/**
 * Lembar cetak PTW — replikasi formulir manual EMP untuk rekap fisik.
 * Read-only, menampilkan data izin nyata. Dipakai untuk izin yang sudah
 * terbit (aktif/selesai/closed). Semua role boleh mencetak.
 *
 * Teknis: HTML + CSS print (@media print). Pengguna menekan tombol "Cetak"
 * lalu Save as PDF / print dari dialog browser.
 *
 * Catatan: template per JENIS izin. Tahap ini fokus HWP/CWP (FOM-00.016);
 * CSE & WAH menyusul.
 */
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

  const jenis = permit.permit_types?.length
    ? permit.permit_types
    : permit.permit_type ? [permit.permit_type] : [];
  const kode = jenis.map((t) => t.kode).join(", ");
  const fmt = (d) => (d ? new Date(d).toLocaleString("id-ID") : "");
  const fmtTgl = (d) => (d ? new Date(d).toLocaleDateString("id-ID") : "");

  // Daftar 21 bahaya standar (nomor + label), untuk menandai yang dipilih.
  const semuaBahaya = permit.hazards || [];
  const bahayaDipilih = new Set(semuaBahaya.map((h) => Number(h.no_bahaya)));

  // PSB yang ditetapkan
  const psbDipilih = new Set((permit.psb_forms || []).map((f) => f.psb_type?.kode).filter(Boolean));

  return (
    <div className="ptw-print-root">
      <style>{`
        .ptw-print-root { background: #f3f3f3; min-height: 100vh; padding: 24px; }
        .ptw-toolbar { max-width: 800px; margin: 0 auto 16px; display: flex; gap: 8px; justify-content: flex-end; }
        .ptw-btn { padding: 8px 16px; border-radius: 8px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; }
        .ptw-btn-print { background: #53b74a; color: #fff; }
        .ptw-btn-back { background: #e2e2e2; color: #333; }
        .ptw-sheet {
          max-width: 800px; margin: 0 auto; background: #fff; padding: 32px;
          font-family: "Work Sans", Arial, sans-serif; color: #1a1c1c; font-size: 11px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.1);
        }
        .ptw-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #9c3f00; padding-bottom: 10px; margin-bottom: 12px; }
        .ptw-title { color: #9c3f00; font-size: 20px; font-weight: 900; margin: 0; }
        .ptw-subtitle { font-size: 11px; color: #555; margin: 2px 0 0; text-transform: uppercase; letter-spacing: 0.5px; }
        .ptw-logo { font-size: 26px; font-weight: 900; color: #9c3f00; font-style: italic; }
        .ptw-nomor-box { display: flex; align-items: center; gap: 8px; }
        .ptw-nomor-label { font-size: 10px; color: #555; }
        .ptw-nomor { border: 1.5px solid #333; padding: 4px 12px; font-size: 16px; font-weight: 700; letter-spacing: 1px; }
        .ptw-fom { font-size: 9px; color: #888; text-align: right; margin-top: 2px; }
        .ptw-sec-head { background: #9c3f00; color: #fff; font-weight: 700; font-size: 12px; padding: 5px 10px; margin: 12px 0 0; }
        .ptw-sec-head span { font-weight: 400; font-size: 10px; opacity: 0.9; }
        .ptw-grid { display: grid; border: 1px solid #ccc; border-top: none; }
        .ptw-cell { border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 6px 8px; }
        .ptw-cell:last-child { border-right: none; }
        .ptw-cell-label { font-size: 9px; color: #666; text-transform: uppercase; display: block; margin-bottom: 3px; }
        .ptw-cell-value { font-size: 11px; min-height: 16px; }
        .ptw-check-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px 12px; padding: 8px 10px; border: 1px solid #ccc; border-top: none; }
        .ptw-check { display: flex; align-items: center; gap: 5px; font-size: 10px; }
        .ptw-box { width: 12px; height: 12px; border: 1.2px solid #666; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
        .ptw-box.checked { background: #9c3f00; color: #fff; border-color: #9c3f00; }
        .ptw-box.checked::after { content: "✓"; }
        .ptw-sign-grid { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid #ccc; border-top: none; }
        .ptw-sign-cell { border-right: 1px solid #ccc; padding: 8px; }
        .ptw-sign-cell:last-child { border-right: none; }
        .ptw-sign-statement { font-size: 10px; color: #444; font-style: italic; margin-bottom: 8px; min-height: 40px; }
        .ptw-sign-box { border: 1px dashed #aaa; padding: 6px; font-size: 10px; }
        .ptw-sign-name { font-weight: 700; }
        .ptw-sign-meta { color: #666; font-size: 9px; margin-top: 2px; }
        .ptw-footer { margin-top: 16px; font-size: 8px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 6px; }
        @media print {
          .ptw-print-root { background: #fff; padding: 0; }
          .ptw-toolbar { display: none; }
          .ptw-sheet { box-shadow: none; max-width: 100%; padding: 12mm; }
          @page { size: A4; margin: 8mm; }
        }
      `}</style>

      <div className="ptw-toolbar">
        <button className="ptw-btn ptw-btn-back" onClick={() => window.history.back()}>← Kembali</button>
        <button className="ptw-btn ptw-btn-print" onClick={() => window.print()}>🖨 Cetak / Simpan PDF</button>
      </div>

      <div className="ptw-sheet">
        {/* Header */}
        <div className="ptw-header">
          <div>
            <h1 className="ptw-title">PERMIT TO WORK (PTW)</h1>
            <p className="ptw-subtitle">
              {kode.includes("HWP") ? "Pekerjaan Panas — Berpotensi Percikan Api" : "Pekerjaan Dingin"}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="ptw-nomor-box" style={{ justifyContent: "flex-end" }}>
              <span className="ptw-nomor-label">Nomor PTW</span>
              <span className="ptw-nomor">{permit.nomor_izin}</span>
              <span className="ptw-logo">emp</span>
            </div>
            <div className="ptw-fom">EMP-SHE-FOM-00.016</div>
          </div>
        </div>

        {/* Bagian 1 — Uraian Pekerjaan */}
        <div className="ptw-sec-head">1. Uraian Pekerjaan <span>(dilengkapi oleh Performing Authority — PA)</span></div>
        <div className="ptw-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="ptw-cell"><span className="ptw-cell-label">Tanggal Diminta</span><span className="ptw-cell-value">{fmtTgl(permit.created_at)}</span></div>
          <div className="ptw-cell"><span className="ptw-cell-label">Diminta Oleh (PA)</span><span className="ptw-cell-value">{permit.performing_authority?.name ?? "-"}</span></div>
          <div className="ptw-cell"><span className="ptw-cell-label">Approval Authority</span><span className="ptw-cell-value">{permit.approval_authority?.name ?? "-"}</span></div>
          <div className="ptw-cell"><span className="ptw-cell-label">Lokasi / Fasilitas</span><span className="ptw-cell-value">{permit.lokasi ?? "-"}</span></div>
          <div className="ptw-cell"><span className="ptw-cell-label">Equipment ID</span><span className="ptw-cell-value">{permit.equipment?.nama ?? permit.equipment?.kode ?? "-"}</span></div>
          <div className="ptw-cell"><span className="ptw-cell-label">Reference WO</span><span className="ptw-cell-value">{permit.work_order?.wo_number ?? "-"}</span></div>
          <div className="ptw-cell" style={{ gridColumn: "span 2" }}><span className="ptw-cell-label">Deskripsi Pekerjaan</span><span className="ptw-cell-value">{permit.deskripsi_pekerjaan ?? "-"}</span></div>
          <div className="ptw-cell"><span className="ptw-cell-label">Durasi</span><span className="ptw-cell-value">{permit.durasi ? `${permit.durasi} jam` : "-"}</span></div>
        </div>

        {/* Bagian 2 — PSB */}
        <div className="ptw-sec-head">2. Formulir PSB (Life-Saving Rules) <span>(ditetapkan oleh AA, dilaksanakan oleh PA)</span></div>
        <div className="ptw-check-row">
          {[
            ["PSB-1", "Memasuki Ruang Terbatas"], ["PSB-2", "Pembukaan Isolasi"], ["PSB-3", "Berkendara (mengemudi)"],
            ["PSB-4", "Isolasi Energi"], ["PSB-6", "Pekerjaan Panas"], ["PSB-7", "Sistem Listrik Beraliran / Hidup"],
            ["PSB-8", "Angkutan Orang"], ["PSB-9", "Pengangkatan Mekanis"], ["PSB-10", "Penanganan Tubular"],
            ["PSB-11", "Bekerja di sekitar Peralatan Bergerak"], ["PSB-12", "Bekerja di Dekat Air"], ["PSB-13", "Bekerja di Ketinggian"],
          ].map(([k, label]) => (
            <span className="ptw-check" key={k}>
              <span className={"ptw-box" + (psbDipilih.has(k) ? " checked" : "")} />
              <span><b>{k}</b> {label}</span>
            </span>
          ))}
        </div>

        {/* Bagian 3 — Identifikasi Bahaya */}
        <div className="ptw-sec-head">3. Identifikasi Bahaya dan Pengendalian <span>(dilengkapi oleh PA, diperiksa IA)</span></div>
        <div className="ptw-check-row">
          {[
            "Confined Space/ruang terbatas", "Akses keluar/masuk yang sulit", "Cuaca buruk",
            "Hot surface/permukaan panas", "Bahan berbahaya (chemicals)", "Vibration/getaran",
            "SIMOPS", "Manual Handling", "Bekerja di luar pembatas",
            "Benda melenting (proyektil)", "Dropped object/benda terjatuh", "Gas beracun (H2S, CO2)",
            "Noise/kebisingan", "Perkakas (hand-tools, power tools)", "Tergelincir, terpeleset, tersandung",
            "Bukaan tanpa pelindung", "Tekanan tinggi", "Heat stress/pajanan panas",
            "Flammables/bahan mudah terbakar", "Spark/percikan bunga api", "Benda bergerak",
          ].map((label, i) => {
            const no = i + 1;
            return (
              <span className="ptw-check" key={no}>
                <span className={"ptw-box" + (bahayaDipilih.has(no) ? " checked" : "")} />
                <span>{String(no).padStart(2, "0")} {label}</span>
              </span>
            );
          })}
        </div>
        <div className="ptw-grid" style={{ gridTemplateColumns: "2fr 1fr 1fr" }}>
          <div className="ptw-cell"><span className="ptw-cell-label">Bahaya Lainnya</span><span className="ptw-cell-value">{permit.bahaya_lainnya ?? "-"}</span></div>
          <div className="ptw-cell"><span className="ptw-cell-label">Nomor JSA</span><span className="ptw-cell-value">{permit.nomor_jsa ?? "-"}</span></div>
          <div className="ptw-cell"><span className="ptw-cell-label">Tingkat Risiko</span><span className="ptw-cell-value">{permit.tingkat_risiko ? permit.tingkat_risiko.charAt(0).toUpperCase() + permit.tingkat_risiko.slice(1) : "-"}</span></div>
        </div>

        {/* Bagian 5 — Pengujian Kadar Gas */}
        <div className="ptw-sec-head">5. Pengujian Kadar Gas <span>(dilaksanakan oleh IA atau AGT)</span></div>
        <div className="ptw-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          <div className="ptw-cell" style={{ background: "#f5f5f5", fontWeight: 700 }}><span className="ptw-cell-value">Waktu</span></div>
          <div className="ptw-cell" style={{ background: "#f5f5f5", fontWeight: 700 }}><span className="ptw-cell-value">O₂ %</span></div>
          <div className="ptw-cell" style={{ background: "#f5f5f5", fontWeight: 700 }}><span className="ptw-cell-value">%LEL</span></div>
          <div className="ptw-cell" style={{ background: "#f5f5f5", fontWeight: 700 }}><span className="ptw-cell-value">Petugas</span></div>
          {(permit.gas_tests || []).length === 0 ? (
            <div className="ptw-cell" style={{ gridColumn: "span 4", textAlign: "center", color: "#999" }}><span className="ptw-cell-value">Belum ada pengujian gas</span></div>
          ) : (
            permit.gas_tests.map((g) => (
              <div key={g.id} style={{ display: "contents" }}>
                <div className="ptw-cell"><span className="ptw-cell-value">{g.tanggal} {g.jam}</span></div>
                <div className="ptw-cell"><span className="ptw-cell-value">{g.oksigen_persen ?? "-"}</span></div>
                <div className="ptw-cell"><span className="ptw-cell-value">{g.lel_persen ?? "-"}</span></div>
                <div className="ptw-cell"><span className="ptw-cell-value">{g.agt?.name ?? "-"}</span></div>
              </div>
            ))
          )}
        </div>

        {/* Bagian 6 & 7 — Penerbitan & Penerimaan (tanda tangan digital: nama + timestamp) */}
        <div className="ptw-sec-head">6. Penerbitan (IA) &nbsp;&nbsp;|&nbsp;&nbsp; 7. Penerimaan PTW (PA)</div>
        <div className="ptw-sign-grid">
          <div className="ptw-sign-cell">
            <div className="ptw-sign-statement">
              Saya, IA, menyatakan bahwa semua bahaya telah diidentifikasi, semua tindakan pencegahan telah dilakukan
              dan kondisi aman untuk melaksanakan pekerjaan.
            </div>
            <div className="ptw-sign-box">
              <div className="ptw-sign-name">{permit.issuing_authority?.name ?? "-"}</div>
              <div className="ptw-sign-meta">Ditandatangani secara digital{permit.tgl_terbit ? ` — ${fmt(permit.tgl_terbit)}` : ""}</div>
            </div>
          </div>
          <div className="ptw-sign-cell">
            <div className="ptw-sign-statement">
              Saya, PA, telah membaca dan memahami semua kondisi dalam PTW ini. Saya menerima tanggung jawab
              pelaksanaan kerja dan akan menghentikan pekerjaan jika kondisi berbahaya.
            </div>
            <div className="ptw-sign-box">
              <div className="ptw-sign-name">{permit.performing_authority?.name ?? "-"}</div>
              <div className="ptw-sign-meta">Ditandatangani secara digital{permit.diterima_pa_at ? ` — ${fmt(permit.diterima_pa_at)}` : ""}</div>
            </div>
          </div>
        </div>

        <div className="ptw-footer">
          Dokumen ini dihasilkan secara digital oleh Sistem Digital Permit SHE — EMP Bentu Limited.
          Status saat cetak: {permit.status?.toUpperCase()} · Dicetak: {fmt(new Date().toISOString())}
        </div>
      </div>
    </div>
  );
}
