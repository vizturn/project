import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Section collapsible untuk halaman detail izin.
 * Header bisa diklik untuk buka/tutup isi. Konsisten dengan kartu lain
 * (bg-white rounded-xl shadow).
 *
 * Props:
 *   - title       : judul section
 *   - icon        : komponen ikon lucide (opsional)
 *   - defaultOpen : status awal buka/tutup (default false = tertutup)
 *   - terisi      : penanda "sudah diisi" (opsional). true/false menampilkan
 *                   titik warna + label di header (hijau = terisi, abu = belum).
 *                   undefined = tidak ada penanda (untuk read-only/riwayat).
 *   - children    : isi section
 */
export default function Section({ title, icon: Icon, defaultOpen = false, terisi, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const adaPenanda = terisi === true || terisi === false;

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition"
      >
        <span className="flex items-center gap-2 font-semibold text-slate-800">
          {Icon && <Icon size={18} className="text-brand" />}
          {title}
          {adaPenanda && (
            <span className="flex items-center gap-1 ml-1">
              <span
                className={
                  "inline-block w-2.5 h-2.5 rounded-full " +
                  (terisi ? "bg-emerald-500" : "bg-slate-300")
                }
              />
              <span className={"text-xs font-normal " + (terisi ? "text-emerald-600" : "text-slate-400")}>
                {terisi ? "Terisi" : "Belum diisi"}
              </span>
            </span>
          )}
        </span>
        <ChevronDown
          size={20}
          className={"text-slate-400 transition-transform " + (open ? "rotate-180" : "")}
        />
      </button>
      {open && <div className="px-6 pb-6 pt-0">{children}</div>}
    </div>
  );
}
