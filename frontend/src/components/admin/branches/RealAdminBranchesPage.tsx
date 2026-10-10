"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faPlus,
  faRefresh,
  faTrash,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import ArchiveRecordButton from "@/components/admin/archive/ArchiveRecordButton";
import { getAuthToken } from "@/lib/auth/authStorage";
import {
  createAdminBranch,
  deleteAdminBranch,
  getAdminBranch,
  getAdminBranchErrorMessage,
  getAdminBranches,
  getBranchValidationErrors,
  updateAdminBranch,
} from "@/lib/adminBranchesApi";
import type {
  AdminBranch,
  AdminBranchDetail,
  AdminBranchPayload,
} from "@/lib/adminBranchTypes";
import BranchModalShell from "./BranchModalShell";

type EditorMode = "create" | AdminBranch | null;
type FormErrors = Record<string, string[]>;

const EMPTY_FORM: AdminBranchPayload = {
  name: "",
  address: "",
  contact_number: "",
  pickup_available: true,
  status: "active",
};

export default function RealAdminBranchesPage() {
  const token = getAuthToken();
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [summary, setSummary] = useState({
    total_branches: 0,
    active_branches: 0,
    pickup_available_branches: 0,
    active_staff: 0,
  });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<AdminBranchDetail | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorMode>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBranch | null>(null);

  const loadBranches = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your Admin session is unavailable. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getAdminBranches(token, {
        search: query,
        status,
        page,
        perPage: 10,
      });

      setBranches(response.branches);
      setSummary(response.summary);
      setLastPage(response.meta.last_page);

      if (
        selectedId !== null &&
        !response.branches.some((branch) => branch.id === selectedId)
      ) {
        setSelectedId(null);
        setSelectedBranch(null);
      }
    } catch (requestError) {
      setError(getAdminBranchErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page, query, selectedId, status, token]);

  const loadBranchDetails = useCallback(async () => {
    if (!token || selectedId === null) {
      setSelectedBranch(null);
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await getAdminBranch(token, selectedId);
      setSelectedBranch(response.branch);
    } catch (requestError) {
      setDetailError(getAdminBranchErrorMessage(requestError));
      setSelectedBranch(null);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedId, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBranches(), 150);

    return () => window.clearTimeout(timer);
  }, [loadBranches]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBranchDetails(), 0);

    return () => window.clearTimeout(timer);
  }, [loadBranchDetails]);

  const selectBranch = useCallback((branch: AdminBranch) => {
    setSelectedId(branch.id);
    setSelectedBranch(null);
    setDetailError(null);
  }, []);

  const removeBranch = useCallback(async () => {
    if (!token || !deleteTarget) {
      return;
    }

    try {
      await deleteAdminBranch(token, deleteTarget.id);

      if (selectedId === deleteTarget.id) {
        setSelectedId(null);
        setSelectedBranch(null);
      }

      setDeleteTarget(null);
      await loadBranches();
    } catch (requestError) {
      setError(getAdminBranchErrorMessage(requestError));
      setDeleteTarget(null);
    }
  }, [deleteTarget, loadBranches, selectedId, token]);

  const cards = useMemo(
    () => [
      [String(summary.total_branches), "Total Branches", "Current branch records"],
      [String(summary.active_branches), "Active Branches", "Available operational locations"],
      [
        String(summary.pickup_available_branches),
        "Pickup Available",
        "Branches offering store pickup",
      ],
      [String(summary.active_staff), "Active Staff", "Assigned active staff accounts"],
    ],
    [summary],
  );

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
            Branch Management
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
            ALD Branches
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Manage real branch records used by public branch selection, checkout,
            staff assignments, and fulfillment operations.
          </p>
        </div>
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700"
          type="button"
          onClick={() => setEditor("create")}
        >
          <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
          Add Branch
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([value, label, description]) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-3xl font-bold text-[#0B1930]">{value}</p>
            <h2 className="mt-1 font-semibold text-[#0B1930]">{label}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </article>
        ))}
      </section>

      {error && <InlineError message={error} onRetry={() => void loadBranches()} />}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <label className="min-w-0 flex-1">
            <span className="sr-only">Search branches</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              placeholder="Search branch, address, or contact"
            />
          </label>
          <label className="md:w-48">
            <span className="sr-only">Filter by branch status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void loadBranches()}
            aria-label="Refresh branches"
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-slate-600 hover:bg-slate-50"
          >
            <FontAwesomeIcon icon={faRefresh} aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <LoadingRows />
          ) : branches.length === 0 ? (
            <EmptyState onAdd={() => setEditor("create")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Pickup</th>
                    <th className="px-4 py-3">Staff</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.map((branch) => (
                    <tr
                      key={branch.id}
                      tabIndex={0}
                      onClick={() => selectBranch(branch)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectBranch(branch);
                        }
                      }}
                      className={`cursor-pointer outline-none hover:bg-orange-50/40 focus:bg-orange-50/60 ${
                        selectedId === branch.id ? "bg-orange-50/60" : ""
                      }`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-600">
                            <FontAwesomeIcon icon={faLocationDot} aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold text-[#0B1930]">
                              {branch.name}
                            </span>
                            <span className="mt-1 block max-w-xs truncate text-xs text-slate-500">
                              {branch.address}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <AdminBadge>{formatStatus(branch.status)}</AdminBadge>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {branch.pickup_available ? "Available" : "Unavailable"}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#0B1930]">
                        {branch.active_staff_count}/{branch.staff_count}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#0B1930]">
                        {branch.order_count}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              selectBranch(branch);
                            }}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Details
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditor(branch);
                            }}
                            className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                          >
                            Manage
                          </button>
                          <ArchiveRecordButton type="branch" id={branch.id} label={branch.name} onArchived={loadBranches} />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(branch);
                            }}
                            aria-label={`Delete ${branch.name}`}
                            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-red-600 hover:bg-red-50"
                          >
                            <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && branches.length > 0 && (
            <Pagination current={page} last={lastPage} onChange={setPage} />
          )}
        </div>

        <BranchDetailsPanel
          branch={selectedBranch}
          loading={detailLoading}
          error={detailError}
          onRetry={() => void loadBranchDetails()}
          onClose={() => {
            setSelectedId(null);
            setSelectedBranch(null);
          }}
        />
      </section>

      {editor && (
        <BranchEditorModal
          key={editor === "create" ? "create" : String(editor.id)}
          mode={editor}
          existingBranches={branches}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            setEditor(null);
            await loadBranches();
          }}
        />
      )}

      <DeleteBranchModal
        branch={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void removeBranch()}
      />
    </div>
  );
}

function BranchDetailsPanel({
  branch,
  loading,
  error,
  onRetry,
  onClose,
}: {
  branch: AdminBranchDetail | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onClose: () => void;
}) {
  if (loading) {
    return (
      <section className="grid min-h-80 place-items-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <LoadingRows />
      </section>
    );
  }

  if (error) {
    return (
      <section className="grid min-h-80 place-items-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <InlineError message={error} onRetry={onRetry} />
      </section>
    );
  }

  if (!branch) {
    return (
      <section className="grid min-h-80 place-items-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div>
          <FontAwesomeIcon icon={faLocationDot} className="text-3xl text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            Select a branch to view its live details and assigned staff.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-600">
            Branch details
          </p>
          <h2 className="mt-1 truncate text-xl font-bold text-[#0B1930]">
            {branch.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {formatStatus(branch.status)} · {branch.pickup_available ? "Pickup available" : "Pickup unavailable"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold text-slate-500 hover:text-[#0B1930]"
        >
          Close
        </button>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <Detail label="Address" value={branch.address} wide />
        <Detail label="Contact" value={branch.contact_number} />
        <Detail label="Orders" value={String(branch.order_count)} />
        <Detail label="Pickup requests" value={String(branch.pickup_count)} />
        <Detail label="Delivery requests" value={String(branch.delivery_count)} />
        <Detail
          label="Staff"
          value={`${branch.active_staff_count} active / ${branch.staff_count} total`}
        />
      </dl>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faUsers} className="text-orange-600" aria-hidden="true" />
          <h3 className="font-semibold text-[#0B1930]">Assigned staff</h3>
        </div>
        {branch.staff.length ? (
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {branch.staff.map((staffMember) => (
              <li key={staffMember.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0B1930]">
                    {staffMember.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">{staffMember.email}</p>
                </div>
                <AdminBadge>{formatStatus(staffMember.status)}</AdminBadge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
            No staff are currently assigned to this branch.
          </p>
        )}
      </div>
    </section>
  );
}

function BranchEditorModal({
  mode,
  existingBranches,
  onClose,
  onSaved,
}: {
  mode: "create" | AdminBranch;
  existingBranches: AdminBranch[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const token = getAuthToken();
  const [values, setValues] = useState<AdminBranchPayload>(() =>
    mode === "create"
      ? EMPTY_FORM
      : {
          name: mode.name,
          address: mode.address,
          contact_number: mode.contact_number,
          pickup_available: mode.pickup_available,
          status: mode.status === "inactive" ? "inactive" : "active",
        },
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isEditing = mode !== "create";
  const editingBranch = mode === "create" ? null : mode;

  const update = <Field extends keyof AdminBranchPayload>(
    field: Field,
    value: AdminBranchPayload[Field],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const localErrors: FormErrors = {};

    if (!values.name.trim()) {
      localErrors.name = ["Please enter a branch name."];
    }

    if (!values.address.trim()) {
      localErrors.address = ["Please enter a branch address."];
    }

    if (!values.contact_number.trim()) {
      localErrors.contact_number = ["Please enter a contact number."];
    }

    const duplicate = existingBranches.some(
      (branch) =>
        branch.name.trim().toLowerCase() === values.name.trim().toLowerCase() &&
        (!editingBranch || branch.id !== editingBranch.id),
    );

    if (duplicate) {
      localErrors.name = ["A branch with this name already exists."];
    }

    if (Object.keys(localErrors).length) {
      setErrors(localErrors);
      return;
    }

    if (!token) {
      setFormError("Your Admin session is unavailable. Please sign in again.");
      return;
    }

    setSaving(true);
    setErrors({});
    setFormError(null);

    const payload: AdminBranchPayload = {
      name: values.name.trim(),
      address: values.address.trim(),
      contact_number: values.contact_number.trim(),
      pickup_available: values.pickup_available,
      status: values.status,
    };

    try {
      if (editingBranch) {
        await updateAdminBranch(token, editingBranch.id, payload);
      } else {
        await createAdminBranch(token, payload);
      }

      await onSaved();
    } catch (requestError) {
      setFormError(getAdminBranchErrorMessage(requestError));
      setErrors(getBranchValidationErrors(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <BranchModalShell
      isOpen
      eyebrow="Branch Management"
      title={isEditing ? "Manage Branch" : "Add Branch"}
      description={
        isEditing
          ? "Update the live branch record used by ALD operations."
          : "Create a branch record for checkout and staff operations."
      }
      titleId="admin-branch-editor-title"
      descriptionId="admin-branch-editor-description"
      onClose={onClose}
      footer={
        <div className="admin-order-modal-footer-actions">
          <button
            className="admin-order-modal-button admin-order-modal-button-secondary"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="admin-order-modal-button admin-order-modal-button-primary"
            type="submit"
            form="admin-branch-editor-form"
            disabled={saving}
          >
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Branch"}
          </button>
        </div>
      }
    >
      <form
        id="admin-branch-editor-form"
        className="space-y-5"
        onSubmit={submit}
        noValidate
      >
        {formError && <InlineError message={formError} />}
        <section className="admin-order-modal-section">
          <h3 className="admin-order-modal-section-title">Branch information</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Branch name"
              value={values.name}
              error={errors.name?.[0]}
              required
              onChange={(value) => update("name", value)}
            />
            <Field
              label="Contact number"
              value={values.contact_number}
              error={errors.contact_number?.[0]}
              required
              onChange={(value) => update("contact_number", value)}
            />
            <Field
              label="Address"
              value={values.address}
              error={errors.address?.[0]}
              required
              wide
              multiline
              onChange={(value) => update("address", value)}
            />
          </div>
        </section>
        <section className="admin-order-modal-section">
          <h3 className="admin-order-modal-section-title">Branch settings</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-[#0B1930]">
              <input
                type="checkbox"
                checked={values.pickup_available}
                className="size-4 accent-orange-600"
                onChange={(event) => update("pickup_available", event.target.checked)}
              />
              Store pickup available
            </label>
            <label className="admin-order-modal-field">
              <span>Status</span>
              <select
                value={values.status}
                onChange={(event) =>
                  update("status", event.target.value as AdminBranchPayload["status"])
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Deactivating a branch keeps historical staff and fulfillment records intact
            while removing it from active public branch selection.
          </p>
        </section>
      </form>
    </BranchModalShell>
  );
}

function DeleteBranchModal({
  branch,
  onClose,
  onConfirm,
}: {
  branch: AdminBranch | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!branch) {
    return null;
  }

  const hasReferences =
    branch.staff_count > 0 ||
    branch.order_count > 0 ||
    branch.pickup_count > 0 ||
    branch.delivery_count > 0;

  return (
    <BranchModalShell
      isOpen
      eyebrow="Branch Management"
      title="Delete Branch"
      description={branch.name}
      titleId="admin-branch-delete-title"
      descriptionId="admin-branch-delete-description"
      onClose={onClose}
      footer={
        <div className="admin-order-modal-footer-actions">
          <button
            className="admin-order-modal-button admin-order-modal-button-secondary"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="admin-order-modal-button bg-red-600 text-white hover:bg-red-700"
            type="button"
            onClick={onConfirm}
            disabled={hasReferences}
          >
            <FontAwesomeIcon icon={faTrash} aria-hidden="true" />
            Delete
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-sm leading-6 text-slate-600">
        <p>
          This permanently deletes the branch record. Historical orders and staff
          assignments must remain safe, so a referenced branch cannot be deleted.
        </p>
        {hasReferences ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            This branch has {branch.staff_count} staff, {branch.order_count} orders,
            {" "}{branch.pickup_count} pickup requests, or {branch.delivery_count} delivery
            requests. Set it to inactive instead.
          </p>
        ) : (
          <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            This branch has no current references and can be safely deleted.
          </p>
        )}
      </div>
    </BranchModalShell>
  );
}

function Field({
  label,
  value,
  error,
  required = false,
  wide = false,
  multiline = false,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  wide?: boolean;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  const fieldId = `admin-branch-${label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <label className={`admin-order-modal-field ${wide ? "md:col-span-2" : ""}`}>
      <span>
        {label} {required && <b aria-hidden="true">*</b>}
      </span>
      {multiline ? (
        <textarea
          id={fieldId}
          value={value}
          rows={3}
          required={required}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          id={fieldId}
          value={value}
          required={required}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error && (
        <span className="text-xs font-medium text-red-600" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}

function BranchDetailsPanelDetail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words font-medium text-[#0B1930]">
        {value || "Not configured"}
      </dd>
    </div>
  );
}

function Detail(props: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return <BranchDetailsPanelDetail {...props} />;
}

function Pagination({
  current,
  last,
  onChange,
}: {
  current: number;
  last: number;
  onChange: (page: number) => void;
}) {
  if (last <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm">
      <span className="text-slate-500">
        Page {current} of {last}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={current <= 1}
          onClick={() => onChange(current - 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={current >= last}
          onClick={() => onChange(current + 1)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-5" aria-live="polite" aria-label="Loading branches">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="grid min-h-64 place-items-center p-8 text-center">
      <div>
        <FontAwesomeIcon icon={faLocationDot} className="text-3xl text-slate-300" />
        <p className="mt-3 text-sm text-slate-500">
          No branches match the current filters.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Add Branch
        </button>
      </div>
    </div>
  );
}

function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-semibold underline">
          Retry
        </button>
      )}
    </div>
  );
}

function formatStatus(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
