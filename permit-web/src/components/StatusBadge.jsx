import { statusLabel, statusClass } from "../lib/status";

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusClass(status)}`}>
      {statusLabel(status)}
    </span>
  );
}
