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
 *   - children    : isi section
 */
export default function Section({ title, icon: Icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

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
