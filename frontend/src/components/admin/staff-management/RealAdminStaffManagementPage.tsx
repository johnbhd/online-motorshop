"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faKey,
  faPlus,
  faRefresh,
  faTrash,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import ArchiveRecordButton from "@/components/admin/archive/ArchiveRecordButton";
import BranchModalShell from "@/components/admin/branches/BranchModalShell";
import {
  createAdminStaff,
  deleteAdminStaff,
  getAdminStaff,
  getAdminStaffErrorMessage,
  getAdminStaffMember,
  getStaffValidationErrors,
  updateAdminStaff,
  updateAdminStaffPassword,
} from "@/lib/adminStaffApi";
import type { AdminStaff, AdminStaffPayload } from "@/lib/adminStaffTypes";
import {
  getAdminBranchErrorMessage,
  getAdminBranches,
} from "@/lib/adminBranchesApi";
import type { AdminBranch } from "@/lib/adminBranchTypes";
import { getAuthToken } from "@/lib/auth/authStorage";

type EditorMode = "create" | AdminStaff | null;
type FormErrors = Record<string, string[]>;
type StaffForm = {
  name: string;
  email: string;
  branch_id: string;
  status: "active" | "inactive";
  password: string;
  password_confirmation: string;
};

const EMPTY_FORM: StaffForm = {
  name: "",
  email: "",
  branch_id: "",
  status: "active",
  password: "",
  password_confirmation: "",
};

export default function RealAdminStaffManagementPage() {
  const token = getAuthToken();
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [summary, setSummary] = useState({
    total_staff: 0,
    active_staff: 0,
    inactive_staff: 0,
  });
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [branchId, setBranchId] = useState<number | "">("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<AdminStaff | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorMode>(null);
  const [passwordTarget, setPasswordTarget] = useState<AdminStaff | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminStaff | null>(null);

  const loadBranches = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await getAdminBranches(token, { perPage: 100 });
      setBranches(response.branches);
    } catch (requestError) {
      setError(getAdminBranchErrorMessage(requestError));
    }
  }, [token]);

  const loadStaff = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your Admin session is unavailable. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getAdminStaff(token, {
        search: query,
        branchId,
        status,
        page,
        perPage: 10,
      });

      setStaff(response.staff);
      setSummary(response.summary);
      setSummaryLoaded(true);
      setLastPage(response.meta.last_page);

      if (
        selectedId !== null &&
        !response.staff.some((staffMember) => staffMember.id === selectedId)
      ) {
        setSelectedId(null);
        setSelectedStaff(null);
      }
    } catch (requestError) {
      setError(getAdminStaffErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [branchId, page, query, selectedId, status, token]);

  const loadDetails = useCallback(async () => {
    if (!token || selectedId === null) {
      setSelectedStaff(null);
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    setDetailError(null);

    try {
      const response = await getAdminStaffMember(token, selectedId);
      setSelectedStaff(response.staff);
    } catch (requestError) {
      setDetailError(getAdminStaffErrorMessage(requestError));
      setSelectedStaff(null);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedId, token]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBranches(), 0);

    return () => window.clearTimeout(timer);
  }, [loadBranches]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStaff(), 150);

    return () => window.clearTimeout(timer);
  }, [loadStaff]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDetails(), 0);

    return () => window.clearTimeout(timer);
  }, [loadDetails]);

  const cards = useMemo(
    () => [
      [summaryLoaded ? String(summary.total_staff) : "—", "Total Staff Accounts", "Live staff records"],
      [summaryLoaded ? String(summary.active_staff) : "—", "Active Accounts", "Can sign in and work"],
      [summaryLoaded ? String(summary.inactive_staff) : "—", "Inactive Accounts", "Sign-in access blocked"],
    ],
    [summary, summaryLoaded],
  );

  const selectStaff = useCallback((staffMember: AdminStaff) => {
    setSelectedId(staffMember.id);
    setSelectedStaff(null);
    setDetailError(null);
  }, []);

  const removeStaff = useCallback(async () => {
    if (!token || !deleteTarget) {
      return;
    }

    try {
      await deleteAdminStaff(token, deleteTarget.id);
      if (selectedId === deleteTarget.id) {
        setSelectedId(null);
        setSelectedStaff(null);
      }
      setDeleteTarget(null);
      await loadStaff();
    } catch (requestError) {
      setError(getAdminStaffErrorMessage(requestError));
      setDeleteTarget(null);
    }
  }, [deleteTarget, loadStaff, selectedId, token]);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
            Staff Management
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">
            Staff Accounts
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Manage real staff users, branch assignments, access status, and password
            lifecycle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditor("create")}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700"
        >
          <FontAwesomeIcon icon={faPlus} aria-hidden="true" />
          Add Staff Account
        </button>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map(([value, label, description]) => (
          <article key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-3xl font-bold text-[#0B1930]">{value}</p>
            <h2 className="mt-1 font-semibold text-[#0B1930]">{label}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </article>
        ))}
      </section>

      {error && <InlineError message={error} onRetry={() => void loadStaff()} />}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_13rem_11rem_auto]">
          <label>
            <span className="sr-only">Search staff</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email"
              className="min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </label>
          <label>
            <span className="sr-only">Filter staff by branch</span>
            <select
              value={branchId}
              onChange={(event) => {
                setBranchId(event.target.value ? Number(event.target.value) : "");
                setPage(1);
              }}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              <option value="">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter staff by status</span>
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
            onClick={() => void loadStaff()}
            aria-label="Refresh staff accounts"
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
          ) : staff.length === 0 ? (
            <EmptyState onAdd={() => setEditor("create")} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Staff</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Handled</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((staffMember) => (
                    <tr
                      key={staffMember.id}
                      tabIndex={0}
                      onClick={() => selectStaff(staffMember)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          selectStaff(staffMember);
                        }
                      }}
                      className={`cursor-pointer outline-none hover:bg-orange-50/40 focus:bg-orange-50/60 ${selectedId === staffMember.id ? "bg-orange-50/60" : ""}`}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
                            <FontAwesomeIcon icon={faUser} aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-[#0B1930]">
                              {staffMember.name}
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">Staff</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{staffMember.email}</td>
                      <td className="px-4 py-4 text-slate-600">
                        {staffMember.branch?.name ?? "Unassigned"}
                      </td>
                      <td className="px-4 py-4">
                        <AdminBadge>{formatStatus(staffMember.status)}</AdminBadge>
                      </td>
                      <td className="px-4 py-4 font-semibold text-[#0B1930]">
                        {staffMember.orders_handled + staffMember.pickup_requests_handled + staffMember.delivery_requests_handled}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setEditor(staffMember);
                            }}
                            className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                          >
                            Manage
                          </button>
                          <ArchiveRecordButton type="staff" id={staffMember.id} label={staffMember.name} onArchived={loadStaff} />
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDeleteTarget(staffMember);
                            }}
                            aria-label={`Delete ${staffMember.name}`}
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
          {!loading && staff.length > 0 && (
            <Pagination current={page} last={lastPage} onChange={setPage} />
          )}
        </div>

        <StaffDetailsPanel
          staff={selectedStaff}
          loading={detailLoading}
          error={detailError}
          onRetry={() => void loadDetails()}
          onResetPassword={() => {
            if (selectedStaff) {
              setPasswordTarget(selectedStaff);
            }
          }}
          onClose={() => {
            setSelectedId(null);
            setSelectedStaff(null);
          }}
        />
      </section>

      {editor && (
        <StaffEditorModal
          key={editor === "create" ? "create" : String(editor.id)}
          mode={editor}
          branches={branches}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            setEditor(null);
            await loadBranches();
            await loadStaff();
            await loadDetails();
          }}
        />
      )}

      <PasswordModal
        key={passwordTarget ? String(passwordTarget.id) : "none"}
        staff={passwordTarget}
        onClose={() => setPasswordTarget(null)}
        onSaved={() => setPasswordTarget(null)}
      />
      <DeleteStaffModal
        staff={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void removeStaff()}
      />
    </div>
  );
}

function StaffDetailsPanel({
  staff,
  loading,
  error,
  onRetry,
  onResetPassword,
  onClose,
}: {
  staff: AdminStaff | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onResetPassword: () => void;
  onClose: () => void;
}) {
  if (loading) {
    return <section className="grid min-h-80 place-items-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><LoadingRows /></section>;
  }

  if (error) {
    return <section className="grid min-h-80 place-items-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><InlineError message={error} onRetry={onRetry} /></section>;
  }

  if (!staff) {
    return (
      <section className="grid min-h-80 place-items-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div>
          <FontAwesomeIcon icon={faUsers} className="text-3xl text-slate-300" aria-hidden="true" />
          <p className="mt-3 text-sm text-slate-500">Select a staff account to view live details.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-600">Staff details</p>
          <h2 className="mt-1 truncate text-xl font-bold text-[#0B1930]">{staff.name}</h2>
          <p className="mt-1 truncate text-sm text-slate-500">{staff.email}</p>
        </div>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-[#0B1930]">Close</button>
      </header>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <Detail label="Role" value="Staff" />
        <Detail label="Status" value={formatStatus(staff.status)} />
        <Detail label="Branch" value={staff.branch?.name ?? "Unassigned"} wide />
        <Detail label="Orders handled" value={String(staff.orders_handled)} />
        <Detail label="Payments verified" value={String(staff.payments_verified)} />
        <Detail label="Pickup requests" value={String(staff.pickup_requests_handled)} />
        <Detail label="Delivery requests" value={String(staff.delivery_requests_handled)} />
        <Detail label="Messages sent" value={String(staff.messages_sent)} />
      </dl>
      <p className="mt-5 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-500">
        Passwords, password hashes, remember tokens, and API tokens are never returned by the Admin Staff API.
      </p>
      <button
        type="button"
        onClick={onResetPassword}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50"
      >
        <FontAwesomeIcon icon={faKey} aria-hidden="true" />
        Reset password
      </button>
    </section>
  );
}

function StaffEditorModal({
  mode,
  branches,
  onClose,
  onSaved,
}: {
  mode: "create" | AdminStaff;
  branches: AdminBranch[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const token = getAuthToken();
  const editing = mode !== "create";
  const [form, setForm] = useState<StaffForm>(() =>
    mode === "create"
      ? EMPTY_FORM
      : {
          name: mode.name,
          email: mode.email,
          branch_id: mode.branch ? String(mode.branch.id) : "",
          status: mode.status === "inactive" ? "inactive" : "active",
          password: "",
          password_confirmation: "",
        },
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [requestError, setRequestError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof StaffForm>(key: K, value: StaffForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: [] }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setRequestError("Your Admin session is unavailable. Please sign in again.");
      return;
    }

    setSaving(true);
    setErrors({});
    setRequestError(null);

    const payload: AdminStaffPayload = {
      name: form.name,
      email: form.email,
      status: form.status,
    };

    if (!editing || Number(form.branch_id) !== mode.branch?.id) {
      payload.branch_id = Number(form.branch_id);
    }

    if (!editing) {
      payload.password = form.password;
      payload.password_confirmation = form.password_confirmation;
    }

    try {
      if (editing) {
        await updateAdminStaff(token, mode.id, payload);
      } else {
        await createAdminStaff(token, payload);
      }
      await onSaved();
    } catch (requestErrorValue) {
      setRequestError(getAdminStaffErrorMessage(requestErrorValue));
      setErrors(getStaffValidationErrors(requestErrorValue));
    } finally {
      setSaving(false);
    }
  }

  const availableBranches = branches.filter(
    (branch) => branch.status === "active" || (editing && branch.id === mode.branch?.id),
  );

  return (
    <BranchModalShell
      isOpen
      eyebrow="Staff Management"
      title={editing ? "Manage Staff Account" : "Add Staff Account"}
      description={editing ? mode.email : "Create a real Staff user account."}
      titleId="admin-staff-editor-title"
      descriptionId="admin-staff-editor-description"
      onClose={onClose}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          {editing ? (
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">
              Cancel
            </button>
          ) : <span />}
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
            <button type="submit" form="admin-staff-editor-form" disabled={saving} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Staff"}
            </button>
          </div>
        </div>
      }
    >
      <form id="admin-staff-editor-form" onSubmit={submit} className="space-y-4">
        {requestError && <InlineError message={requestError} />}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name" value={form.name} required error={errors.name?.[0]} onChange={(value) => update("name", value)} />
          <Field label="Email" value={form.email} required error={errors.email?.[0]} onChange={(value) => update("email", value)} type="email" />
          <label className="admin-order-modal-field">
            <span>Branch <b aria-hidden="true">*</b></span>
            <select value={form.branch_id} required onChange={(event) => update("branch_id", event.target.value)} aria-invalid={Boolean(errors.branch_id?.length)}>
              <option value="">Select active branch</option>
              {availableBranches.map((branch) => (
                <option key={branch.id} value={branch.id} disabled={branch.status !== "active"}>{branch.name}{branch.status !== "active" ? " (inactive)" : ""}</option>
              ))}
            </select>
            {errors.branch_id?.[0] && <span className="text-xs font-medium text-red-600" role="alert">{errors.branch_id[0]}</span>}
          </label>
          <label className="admin-order-modal-field">
            <span>Status</span>
            <select value={form.status} onChange={(event) => update("status", event.target.value as StaffForm["status"]) }>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.status?.[0] && <span className="text-xs font-medium text-red-600" role="alert">{errors.status[0]}</span>}
          </label>
          {!editing && <Field label="Password" value={form.password} required error={errors.password?.[0]} onChange={(value) => update("password", value)} type="password" />}
          {!editing && <Field label="Confirm password" value={form.password_confirmation} required error={errors.password_confirmation?.[0]} onChange={(value) => update("password_confirmation", value)} type="password" />}
        </div>
        <p className="text-xs leading-5 text-slate-500">
          Role is always enforced as Staff by Laravel. New accounts can only be assigned to active branches.
        </p>
      </form>
    </BranchModalShell>
  );
}

function PasswordModal({ staff, onClose, onSaved }: { staff: AdminStaff | null; onClose: () => void; onSaved: () => void }) {
  const token = getAuthToken();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!staff) {
    return null;
  }

  const target = staff;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("Your Admin session is unavailable. Please sign in again.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateAdminStaffPassword(token, target.id, { password, password_confirmation: confirmation });
      onSaved();
    } catch (requestError) {
      setError(getAdminStaffErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BranchModalShell isOpen eyebrow="Staff Management" title="Reset Password" description={staff.email} titleId="admin-staff-password-title" descriptionId="admin-staff-password-description" onClose={onClose} footer={<div className="flex w-full justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" form="admin-staff-password-form" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><FontAwesomeIcon icon={faKey} aria-hidden="true" />{saving ? "Updating..." : "Update Password"}</button></div>}>
      <form id="admin-staff-password-form" onSubmit={submit} className="space-y-4">
        {error && <InlineError message={error} />}
        <Field label="New password" value={password} required onChange={setPassword} type="password" />
        <Field label="Confirm new password" value={confirmation} required onChange={setConfirmation} type="password" />
        <p className="text-xs leading-5 text-slate-500">All existing API tokens are revoked after a password reset. The staff member must sign in again.</p>
      </form>
    </BranchModalShell>
  );
}

function DeleteStaffModal({ staff, onClose, onConfirm }: { staff: AdminStaff | null; onClose: () => void; onConfirm: () => void }) {
  if (!staff) {
    return null;
  }

  return (
    <BranchModalShell isOpen eyebrow="Staff Management" title="Delete Staff Account" description={staff.email} titleId="admin-staff-delete-title" descriptionId="admin-staff-delete-description" onClose={onClose} footer={<div className="flex w-full justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={onConfirm} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"><FontAwesomeIcon icon={faTrash} aria-hidden="true" />Delete</button></div>}>
      <div className="space-y-4 text-sm leading-6 text-slate-600">
        <p>Only staff accounts with no operational or historical references can be permanently deleted.</p>
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">If Laravel returns a conflict, the account remains safe. Set it to inactive instead.</p>
      </div>
    </BranchModalShell>
  );
}

function Field({ label, value, error, required = false, type = "text", onChange }: { label: string; value: string; error?: string; required?: boolean; type?: string; onChange: (value: string) => void }) {
  const fieldId = `admin-staff-${label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <label className="admin-order-modal-field">
      <span>{label} {required && <b aria-hidden="true">*</b>}</span>
      <input id={fieldId} type={type} value={value} required={required} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
      {error && <span className="text-xs font-medium text-red-600" role="alert">{error}</span>}
    </label>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? "col-span-2" : ""}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 break-words font-medium text-[#0B1930]">{value}</dd></div>;
}

function Pagination({ current, last, onChange }: { current: number; last: number; onChange: (page: number) => void }) {
  if (last <= 1) {
    return null;
  }

  return <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm"><span className="text-slate-500">Page {current} of {last}</span><div className="flex gap-2"><button type="button" disabled={current <= 1} onClick={() => onChange(current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Previous</button><button type="button" disabled={current >= last} onClick={() => onChange(current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>;
}

function LoadingRows() {
  return <div className="space-y-3 p-5" aria-live="polite" aria-label="Loading staff accounts">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div>;
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return <div className="grid min-h-64 place-items-center p-8 text-center"><div><FontAwesomeIcon icon={faUser} className="text-3xl text-slate-300" aria-hidden="true" /><p className="mt-3 text-sm text-slate-500">No staff accounts match the current filters.</p><button type="button" onClick={onAdd} className="mt-4 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">Add Staff Account</button></div></div>;
}

function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"><span>{message}</span>{onRetry && <button type="button" onClick={onRetry} className="font-semibold underline">Retry</button>}</div>;
}

function formatStatus(value: string) {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}
