"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxArchive } from "@fortawesome/free-solid-svg-icons";
import { getAuthToken } from "@/lib/auth/authStorage";
import { archiveAdminRecord, getAdminArchiveErrorMessage } from "@/lib/adminArchiveApi";
import type { AdminArchiveType } from "@/lib/adminArchiveTypes";

export default function ArchiveRecordButton({
  type,
  id,
  label,
  onArchived,
}: {
  type: AdminArchiveType;
  id: number;
  label: string;
  onArchived?: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const archive = async () => {
    if (!window.confirm(`Archive ${label}? It will be hidden from this Admin list, but its original row, history, relationships, and business status will be preserved.`)) {
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError("Admin session unavailable.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await archiveAdminRecord(token, type, id);
      await onArchived?.();
    } catch (requestError) {
      setError(getAdminArchiveErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void archive();
        }}
        disabled={loading}
        className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-wait disabled:opacity-50"
      >
        <FontAwesomeIcon icon={faBoxArchive} aria-hidden="true" />
        {loading ? "Archiving…" : "Archive"}
      </button>
      {error && <span className="max-w-48 text-right text-[11px] text-red-600">{error}</span>}
    </span>
  );
}
