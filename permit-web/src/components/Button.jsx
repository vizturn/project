/**
 * Tombol reusable untuk seluruh aplikasi.
 *
 * Tujuan: satu sumber kebenaran untuk gaya tombol, agar konsisten dan mudah
 * diubah (ganti warna cukup di sini, semua tombol ikut). Pola ini mengikuti
 * StatusBadge yang sudah dipakai di proyek.
 *
 * Varian:
 *   - primary (default) : aksi utama    -> hijau brand EMP
 *   - danger            : tolak/hapus    -> merah
 *   - saved             : sudah disimpan -> abu (dipakai fitur tombol "tersimpan")
 *   - outline           : aksi sekunder  -> putih dengan border
 *
 * Prop khusus:
 *   - busy  : bila true, tombol dinonaktifkan & menampilkan teks "Menyimpan..."
 *   - as    : ganti elemen (mis. "a") bila perlu; default "button"
 *
 * Sisa prop (onClick, type, disabled, dll) diteruskan apa adanya.
 */
const VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  danger:  "bg-red-700 text-white hover:bg-red-800",
  saved:   "bg-slate-400 text-white hover:bg-slate-500",
  outline: "bg-white text-brand border border-brand hover:bg-brand-50",
};

export default function Button({
  children,
  variant = "primary",
  busy = false,
  disabled = false,
  className = "",
  type = "button",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg " +
    "text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const gaya = VARIANTS[variant] ?? VARIANTS.primary;

  return (
    <button
      type={type}
      disabled={busy || disabled}
      className={`${base} ${gaya} ${className}`}
      {...props}
    >
      {busy ? "Menyimpan..." : children}
    </button>
  );
}
