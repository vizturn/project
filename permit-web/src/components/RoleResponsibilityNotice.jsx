import { ClipboardList, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * Ringkasan Tugas & Tanggung Jawab per peran, sesuai Prosedur Sistem Izin
 * Kerja EMP-SHE-PCR-00.001-02 (Revisi 02, 15 Juni 2025), Bagian 6
 * "Peran dan Tanggung Jawab" (hal. 12-19) — khusus poin Approval Authority,
 * Issuing Authority, dan Performing Authority.
 *
 * Teks TIDAK boleh dikarang bebas — ini menyangkut kepatuhan K3, jadi
 * mengikuti rumusan SOP apa adanya (hanya dirapikan jadi kalimat per-poin).
 */
const TANGGUNG_JAWAB = {
  PA: {
    label: "Performing Authority (PA)",
    bg: "bg-green-50/50",
    border: "border-green-100",
    judul: "text-green-700",
    marker: "marker:text-green-600",
    tugas: [
      "Mengisi uraian pekerjaan: lokasi, deskripsi, referensi WO, durasi pekerjaan, dan data personel.",
      "Menyiapkan dan mengisi formulir PSB (Periksa Sebelum Bekerja) sesuai yang ditetapkan Approval Authority.",
      "Melakukan identifikasi bahaya dan pengendalian awal, serta menyiapkan dokumen pendukung seperti JSA.",
      "Berpartisipasi dalam Pre Job Safety Meeting (PJSM) dan memastikan seluruh personel memahami aturan dan bahaya pekerjaan.",
      "Menerima izin kerja dengan menandatangani pernyataan bahwa seluruh persyaratan telah dipahami dan disetujui.",
      "Menghentikan pekerjaan dan mengembalikan izin jika terjadi kondisi tidak aman atau tidak sesuai PTW.",
      "Mengajukan permohonan revalidasi apabila pekerjaan akan dilanjutkan setelah dihentikan sementara.",
      "Menyelesaikan pekerjaan, memastikan area kerja bersih dan aman.",
      "Melaporkan kepada Issuing Authority setiap kejadian tak terduga yang dapat memengaruhi keselamatan kerja.",
    ],
  },
  AA: {
    label: "Approval Authority (AA)",
    bg: "bg-indigo-50/50",
    border: "border-indigo-100",
    judul: "text-indigo-700",
    marker: "marker:text-indigo-600",
    tugas: [
      "Meninjau dan menyetujui rencana kerja dan personel yang terlibat.",
      "Menentukan jenis formulir Periksa Sebelum Bekerja (PSB) yang sesuai dengan EMP Life Saving Rules.",
      "Memastikan pekerjaan memang membutuhkan izin kerja.",
      "Menilai kelayakan pekerjaan dari sisi teknis dan keselamatan.",
      "Memberi persetujuan resmi di formulir yang diperlukan.",
      "Berkoordinasi dengan Issuing Authority.",
    ],
  },
  IA: {
    label: "Issuing Authority (IA)",
    bg: "bg-cyan-50/50",
    border: "border-cyan-100",
    judul: "text-cyan-700",
    marker: "marker:text-cyan-600",
    tugas: [
      "Memeriksa kelengkapan dan keabsahan informasi dari Performing Authority.",
      "Memastikan identifikasi bahaya dan pengendalian risiko telah tepat.",
      "Memeriksa kesiapan dokumen pendukung seperti sertifikat atau izin lain.",
      "Menentukan kebutuhan uji gas dan menindaklanjuti hasil yang tidak aman.",
      "Memimpin Pre Job Safety Meeting (PJSM) dan menyampaikan aturan keselamatan EMP.",
      "Menerbitkan izin kerja setelah semua syarat keselamatan terpenuhi.",
      "Mengelola revalidasi jika pekerjaan tertunda.",
      "Menutup izin kerja setelah memastikan pekerjaan selesai dan area kerja aman.",
      "Mengawasi pelaksanaan pekerjaan dari sisi izin kerja.",
    ],
  },
};

// Urutan tampil tetap PA -> AA -> IA, mengikuti alur pengajuan izin.
const URUTAN_ROLE = ["PA", "AA", "IA"];

/**
 * Kartu Tugas & Tanggung Jawab, khusus PA/AA/IA.
 * Dipakai sebagai layar pembuka sebelum masuk ke Daftar Izin — lihat
 * pemakaiannya di PermitListPage (prop `onLanjut`).
 */
export default function RoleResponsibilityNotice({ onLanjut }) {
  const { hasRole } = useAuth();

  const rolesDimiliki = URUTAN_ROLE.filter((kode) => hasRole(kode));
  if (rolesDimiliki.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-brand-50 rounded-lg text-brand">
          <ClipboardList size={20} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">Tugas &amp; Tanggung Jawab Anda</h2>
      </div>

      {/* Body — satu kartu per peran yang dipegang user */}
      <div className="p-6 space-y-6">
        {rolesDimiliki.map((kode) => {
          const r = TANGGUNG_JAWAB[kode];
          const tengah = Math.ceil(r.tugas.length / 2);
          const kiri = r.tugas.slice(0, tengah);
          const kanan = r.tugas.slice(tengah);

          return (
            <div key={kode} className={`${r.bg} border ${r.border} rounded-lg p-6`}>
              <h3 className={`text-base font-semibold ${r.judul} mb-6`}>{r.label}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <ul className={`space-y-4 text-sm text-slate-600 list-disc pl-5 ${r.marker}`}>
                  {kiri.map((t, i) => (
                    <li key={i} className="pl-2 leading-relaxed">{t}</li>
                  ))}
                </ul>
                <ul className={`space-y-4 text-sm text-slate-600 list-disc pl-5 ${r.marker}`}>
                  {kanan.map((t, i) => (
                    <li key={i} className="pl-2 leading-relaxed">{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer — sumber rujukan + tombol lanjut ke Daftar Izin */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-slate-400">
          Sesuai Prosedur Sistem Izin Kerja EMP-SHE-PCR-00.001-02, Bagian 6 (Peran dan Tanggung Jawab).
        </p>
        {onLanjut && (
          <button
            type="button"
            onClick={onLanjut}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand-dark transition"
          >
            Lanjut ke Daftar Izin <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
