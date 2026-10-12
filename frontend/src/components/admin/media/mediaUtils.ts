export function label(value: string | null | undefined): string {
  return value
    ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not available";
}

export function formatDate(value: string | null | undefined): string {
  const parsed = value ? new Date(value) : null;

  return parsed && !Number.isNaN(parsed.getTime())
    ? new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(parsed)
    : "Not available";
}

export function formatBytes(value: number | null | undefined): string {
  if (typeof value !== "number" || value < 0) {
    return "Not available";
  }

  if (value < 1024) {
    return String(value) + " B";
  }

  const units = ["KB", "MB", "GB", "TB"];
  let amount = value;
  let unitIndex = -1;

  do {
    amount /= 1024;
    unitIndex += 1;
  } while (amount >= 1024 && unitIndex < units.length - 1);

  return amount.toFixed(amount >= 10 ? 0 : 1) + " " + units[unitIndex];
}

export function statusClasses(status: string): string {
  if (status === "active") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (status === "orphaned") {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  if (status === "cleanup_failed") {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  if (status === "deleted") {
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }

  return "bg-blue-50 text-blue-700 ring-blue-200";
}
