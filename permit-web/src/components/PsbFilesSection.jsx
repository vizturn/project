import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileText, Upload, Trash2, ShieldAlert } from "lucide-react";
import { uploadPsbFile, deletePsbFile, psbFileUrl } from "../services/masterService";

/**
 * Bagian "File PSB" pada halaman detail izin.
 *
 * Menampilkan seluruh file PSB milik izin. Tombol unggah/hapus hanya muncul
 * bila `bisaUnggah` true (AA yang ditugaskan, saat status menunggu_approval).
 *
 * Props:
 *   - permitId
 *   - files: array PsbFile ({ id, nama_asli, file_path })
 *   - bisaUnggah: boolean
 *   - onChanged: callback untuk memuat ulang detail izin setelah upload/hapus
 */
const MAKS_FILE = 6;

export default function PsbFilesSection({ permitId, files = [], bisaUnggah, onChanged }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const pilihFile = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset agar file sama bisa dipilih lagi
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("File PSB harus berformat PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5 MB.");
      return;
    }
    if (files.length >= MAKS_FILE) {
      toast.error(`Maksimal ${MAKS_FILE} file PSB per izin.`);
      return;
    }

    setBusy(true);
    try {
      await uploadPsbFile(permitId, file);
      toast.success("File PSB berhasil diunggah.");
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengunggah file PSB.");
    } finally {
      setBusy(false);
    }
  };

  const hapus = async (id) => {
    setBusy(true);
    try {
      await deletePsbFile(permitId, id);
      toast.success("File PSB dihapus.");
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="text-brand" size={18} />
        <h2 className="font-semibold text-slate-800">File PSB (Life Saving Rules)</h2>
      </div>

      {files.length === 0 ? (
        <p className="text-sm text-slate-400 mb-3">Belum ada file PSB diunggah.</p>
      ) : (
        <ul className="space-y-2 mb-3">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 text-sm border border-slate-100 rounded-lg px-3 py-2">
              <a href={psbFileUrl(f.file_path)} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:underline min-w-0">
                <FileText size={15} className="shrink-0" />
                <span className="truncate">{f.nama_asli}</span>
              </a>
              <div className="flex items-center gap-2 shrink-0">
                {bisaUnggah && (
                  <button onClick={() => hapus(f.id)} disabled={busy}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-50" aria-label="Hapus file">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {bisaUnggah && (
        <div>
          <input ref={inputRef} type="file" accept="application/pdf" onChange={onFile} className="hidden" />
          <button onClick={pilihFile} disabled={busy || files.length >= MAKS_FILE}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-brand text-brand text-sm font-medium hover:bg-brand-50 disabled:opacity-50">
            <Upload size={16} /> {busy ? "Mengunggah..." : "Unggah File PSB (PDF)"}
          </button>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">
            <ShieldAlert size={13} className="shrink-0 mt-0.5" />
            Wajib minimal 1 file untuk menyetujui izin. Maksimal {MAKS_FILE} file, PDF, ≤ 5 MB per file.
          </p>
        </div>
      )}
    </div>
  );
}
