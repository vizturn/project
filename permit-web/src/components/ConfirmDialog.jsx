import Button from "./Button";
import { AlertTriangle } from "lucide-react";

/**
 * Dialog konfirmasi reusable — pengganti window.confirm agar konsisten
 * dengan desain aplikasi.
 *
 * Props:
 *   - open        : boolean, tampil/tidak
 *   - title       : judul dialog
 *   - message     : isi pesan (string atau node)
 *   - confirmLabel: label tombol konfirmasi (default "Konfirmasi")
 *   - cancelLabel : label tombol batal (default "Batal")
 *   - variant     : varian tombol konfirmasi ("primary" | "danger"), default "danger"
 *   - busy        : status loading pada tombol konfirmasi
 *   - onConfirm   : handler saat dikonfirmasi
 *   - onCancel    : handler saat dibatalkan / klik overlay
 */
export default function ConfirmDialog({
  open,
  title = "Konfirmasi",
  message,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "danger",
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={busy ? undefined : onCancel}
      />

      {/* Kartu dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className={"shrink-0 rounded-full p-2 " + (variant === "danger" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand")}>
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-800">{title}</h3>
            {message && <div className="text-sm text-slate-600 mt-1">{message}</div>}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} busy={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
