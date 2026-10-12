import type { AdminAuditLog } from "@/lib/adminAuditTypes";

function label(value: string | null) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Not available";
}

function date(value: string | null) {
  if (!value) return "Not available";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Not available" : new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

export default function AdminAuditHistory({ entries }: { entries: AdminAuditLog[] }) {
  if (!entries.length) return null;

  return (
    <section className="admin-order-modal-section">
      <div className="admin-order-modal-section-title"><h3>Admin Audit History</h3></div>
      <div className="space-y-3">
        {entries.map((entry) => (
          <article key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-[#0B1930]">{label(entry.previous_status)} → {label(entry.new_status)}</strong><time className="text-xs text-slate-500">{date(entry.created_at)}</time></div>
            <p className="mt-1 text-slate-600">{entry.reason}</p>
            <p className="mt-1 text-xs text-slate-500">By {entry.actor?.name ?? "Former Admin"} · {entry.actor?.role ?? "admin"}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
