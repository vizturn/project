export const STATUS_META = {
  draft:               { label: "Draft",               cls: "bg-slate-100 text-slate-700" },
  menunggu_approval:   { label: "Menunggu Approval",    cls: "bg-blue-100 text-blue-700" },
  disetujui:           { label: "Disetujui",            cls: "bg-indigo-100 text-indigo-700" },
  ditolak:             { label: "Ditolak",              cls: "bg-red-100 text-red-700" },
  menunggu_persiapan_pa: { label: "Menunggu Persiapan PA", cls: "bg-fuchsia-100 text-fuchsia-700" },
  menunggu_penerbitan: { label: "Menunggu Penerbitan",  cls: "bg-cyan-100 text-cyan-700" },
  menunggu_penerimaan: { label: "Menunggu Penerimaan PA", cls: "bg-violet-100 text-violet-700" },
  aktif:               { label: "Aktif",                cls: "bg-emerald-100 text-emerald-700" },
  ditunda:             { label: "Ditunda",              cls: "bg-amber-100 text-amber-700" },
  kadaluarsa:          { label: "Kadaluarsa",           cls: "bg-orange-100 text-orange-700" },
  selesai:             { label: "Selesai",              cls: "bg-teal-100 text-teal-700" },
  closed:              { label: "Closed",               cls: "bg-slate-200 text-slate-600" },
};

export const statusLabel = (s) => STATUS_META[s]?.label ?? s;
export const statusClass = (s) => STATUS_META[s]?.cls ?? "bg-slate-100 text-slate-700";
