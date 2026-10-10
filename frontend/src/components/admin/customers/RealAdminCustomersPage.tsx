"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faChartLine,
  faClipboardList,
  faPen,
  faRefresh,
  faRotateLeft,
  faTrash,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import BranchModalShell from "@/components/admin/branches/BranchModalShell";
import CustomerAccountStatusModal from "./CustomerAccountStatusModal";
import {
  deleteAdminCustomer,
  getAdminCustomer,
  getAdminCustomerErrorMessage,
  getAdminCustomers,
  getCustomerValidationErrors,
  updateAdminCustomer,
} from "@/lib/adminCustomersApi";
import type {
  AdminCustomer,
  AdminCustomerDetail,
  AdminCustomerListResponse,
  AdminCustomerPayload,
} from "@/lib/adminCustomerTypes";
import { getAdminBranchErrorMessage, getAdminBranches } from "@/lib/adminBranchesApi";
import type { AdminBranch } from "@/lib/adminBranchTypes";
import { getAuthToken } from "@/lib/auth/authStorage";
import { formatPeso } from "@/components/user/cart/cartData";

type CustomerForm = AdminCustomerPayload;
type FormErrors = Record<string, string[]>;

const EMPTY_FORM: CustomerForm = {
  name: "",
  email: "",
  contact_number: "",
  address: "",
};

function formatDate(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function getPageNumbers(current: number, last: number): Array<number | "ellipsis"> {
  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }

  const numbers: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(last - 1, current + 1);

  if (start > 2) numbers.push("ellipsis");
  for (let number = start; number <= end; number += 1) numbers.push(number);
  if (end < last - 1) numbers.push("ellipsis");
  numbers.push(last);

  return numbers;
}

function label(value: string | null | undefined) {
  if (!value) return "Not available";
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function CustomerFormModal({
  customer,
  form,
  errors,
  saving,
  onChange,
  onSubmit,
  onClose,
}: {
  customer: AdminCustomerDetail;
  form: CustomerForm;
  errors: FormErrors;
  saving: boolean;
  onChange: (field: keyof CustomerForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const fieldError = (field: string) => errors[field]?.[0];

  return (
    <BranchModalShell
      isOpen
      eyebrow="Customer Management"
      title={`Edit ${customer.name}`}
      description={customer.type === "registered" ? "Update the linked customer account safely." : "Update this guest customer record without creating an account."}
      titleId="admin-customer-edit-title"
      descriptionId="admin-customer-edit-description"
      onClose={onClose}
      footer={
        <div className="flex w-full justify-end gap-3">
          <button type="button" onClick={onClose} className="admin-order-modal-button admin-order-modal-button-secondary">
            Cancel
          </button>
          <button type="submit" form="admin-customer-edit-form" disabled={saving} className="admin-order-modal-button admin-order-modal-button-primary disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      }
    >
      <form id="admin-customer-edit-form" onSubmit={onSubmit} className="space-y-5">
        <section className="admin-order-modal-section">
          <div className="admin-order-modal-section-title">
            <FontAwesomeIcon icon={faUser} aria-hidden="true" />
            <h3>Customer Information</h3>
          </div>
          <div className="admin-order-modal-control-grid">
            <label className="admin-order-modal-field">
              <span>Full name</span>
              <input value={form.name} onChange={(event) => onChange("name", event.target.value)} />
              {fieldError("name") && <small className="text-red-600">{fieldError("name")}</small>}
            </label>
            <label className="admin-order-modal-field">
              <span>Email</span>
              <input type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} />
              {fieldError("email") && <small className="text-red-600">{fieldError("email")}</small>}
            </label>
            <label className="admin-order-modal-field">
              <span>Contact number</span>
              <input value={form.contact_number} onChange={(event) => onChange("contact_number", event.target.value)} />
              {fieldError("contact_number") && <small className="text-red-600">{fieldError("contact_number")}</small>}
            </label>
            <label className="admin-order-modal-field">
              <span>Address</span>
              <input value={form.address} onChange={(event) => onChange("address", event.target.value)} />
              {fieldError("address") && <small className="text-red-600">{fieldError("address")}</small>}
            </label>
          </div>
        </section>
      </form>
    </BranchModalShell>
  );
}

function CustomerDetailsModal({
  customer,
  loading,
  error,
  onClose,
  onEdit,
  onDelete,
  onAccountStatus,
}: {
  customer: AdminCustomerDetail | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAccountStatus: () => void;
}) {
  return (
    <BranchModalShell
      isOpen
      eyebrow="Customer Details"
      title={customer?.name ?? "Loading customer"}
      description={customer ? `${label(customer.type)} customer record` : "Loading the real customer record."}
      titleId="admin-customer-details-title"
      descriptionId="admin-customer-details-description"
      status={customer ? <AdminBadge>{label(customer.account?.status ?? customer.type)}</AdminBadge> : undefined}
      onClose={onClose}
      footer={
        <div className="flex w-full justify-between gap-3">
          <div>
            {customer?.type === "registered" && (
                <button
                  type="button"
                  onClick={onAccountStatus}
                  className={
                    customer.account?.status === "active"
                      ? "admin-order-modal-button admin-order-modal-button-danger"
                      : "admin-order-modal-button admin-order-modal-button-primary"
                  }
                >
                  <FontAwesomeIcon
                    icon={customer.account?.status === "active" ? faBan : faRotateLeft}
                    aria-hidden="true"
                  />
                  {customer.account?.status === "active"
                    ? "Suspend account"
                    : "Unsuspend account"}
                </button>
              )}
            {customer?.type === "guest" && (
              <button type="button" onClick={onDelete} className="admin-order-modal-button admin-order-modal-button-danger">
                <FontAwesomeIcon icon={faTrash} aria-hidden="true" /> Delete guest
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {customer && <button type="button" onClick={onEdit} className="admin-order-modal-button admin-order-modal-button-primary"><FontAwesomeIcon icon={faPen} aria-hidden="true" /> Edit</button>}
            <button type="button" onClick={onClose} className="admin-order-modal-button admin-order-modal-button-secondary">Close</button>
          </div>
        </div>
      }
    >
      {loading && <div className="py-12 text-center text-sm text-slate-500">Loading customer details...</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {customer && !loading && !error && (
        <div className="space-y-5">
          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faUser} aria-hidden="true" /><h3>Customer Information</h3></div>
            <dl className="admin-order-modal-detail-grid">
              <div><dt>Name</dt><dd>{customer.name}</dd></div>
              <div><dt>Email</dt><dd>{customer.email || "Not available"}</dd></div>
              <div><dt>Contact</dt><dd>{customer.contact || "Not available"}</dd></div>
              <div><dt>Address</dt><dd>{customer.address || "Not available"}</dd></div>
              <div><dt>Customer since</dt><dd>{formatDate(customer.customer_since)}</dd></div>
            </dl>
          </section>
          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faChartLine} aria-hidden="true" /><h3>Activity</h3></div>
            <dl className="admin-order-modal-detail-grid admin-order-modal-order-grid">
              <div><dt>Type</dt><dd><AdminBadge>{label(customer.type)}</AdminBadge></dd></div>
              <div><dt>Total orders</dt><dd>{customer.summary.orders}</dd></div>
              <div><dt>Active orders</dt><dd>{customer.summary.active_orders}</dd></div>
              <div><dt>Completed orders</dt><dd>{customer.summary.completed_orders}</dd></div>
              <div><dt>Branches used</dt><dd>{customer.summary.branches_used}</dd></div>
            </dl>
          </section>
          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faUsers} aria-hidden="true" /><h3>Branch Activity</h3></div>
            {customer.branches.length ? <div className="flex flex-wrap gap-2">{customer.branches.map((branch) => <AdminBadge key={branch.id}>{`${branch.name} · ${branch.orders} orders`}</AdminBadge>)}</div> : <p className="text-sm text-slate-500">No branch activity recorded.</p>}
          </section>
          <section className="admin-order-modal-section">
            <div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faClipboardList} aria-hidden="true" /><h3>Order History</h3></div>
            {customer.orders.length ? <div className="admin-order-items-table-wrap admin-customer-orders-table-wrap"><table className="admin-order-items-table admin-customer-orders-table"><thead><tr><th>Order</th><th>Created</th><th>Branch</th><th>Total</th><th>Status</th></tr></thead><tbody>{customer.orders.map((order) => <tr key={order.id}><td>{order.reference}</td><td>{formatDate(order.created_at)}</td><td>{order.branch?.name ?? "Not assigned"}</td><td>{formatPeso(order.total_amount)}</td><td><AdminBadge>{label(order.status)}</AdminBadge></td></tr>)}</tbody></table></div> : <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No orders found for this customer.</div>}
          </section>
        </div>
      )}
    </BranchModalShell>
  );
}

export default function RealAdminCustomersPage() {
  const token = getAuthToken();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [branches, setBranches] = useState<AdminBranch[]>([]);
  const [summary, setSummary] = useState<AdminCustomerListResponse["summary"] | null>(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [branchId, setBranchId] = useState<number | "">("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editor, setEditor] = useState<AdminCustomerDetail | null>(null);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminCustomerDetail | null>(null);
  const [accountStatusTarget, setAccountStatusTarget] = useState<AdminCustomerDetail | null>(null);
  const [changingAccountStatus, setChangingAccountStatus] = useState(false);

  const loadCustomers = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setError("Your Admin session is unavailable. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await getAdminCustomers(token, { search: query, type, branchId, status, page, perPage: 10 });
      setCustomers(response.customers);
      setSummary(response.summary);
      setLastPage(response.meta.last_page);
      setPerPage(response.meta.per_page);
      setTotalCustomers(response.meta.total);
      if (selectedId !== null && !response.customers.some((customer) => customer.id === selectedId)) {
        setSelectedId(null);
        setSelectedCustomer(null);
      }
    } catch (requestError) {
      setError(getAdminCustomerErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [branchId, page, query, selectedId, status, token, type]);

  const loadBranches = useCallback(async () => {
    if (!token) return;
    try {
      const response = await getAdminBranches(token, { perPage: 100 });
      setBranches(response.branches);
    } catch (requestError) {
      setError(getAdminBranchErrorMessage(requestError));
    }
  }, [token]);

  const loadDetails = useCallback(async () => {
    if (!token || selectedId === null) {
      setSelectedCustomer(null);
      setDetailLoading(false);
      return;
    }

    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await getAdminCustomer(token, selectedId);
      setSelectedCustomer(response.customer);
    } catch (requestError) {
      setDetailError(getAdminCustomerErrorMessage(requestError));
      setSelectedCustomer(null);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedId, token]);

  useEffect(() => { const timer = window.setTimeout(() => void loadCustomers(), 150); return () => window.clearTimeout(timer); }, [loadCustomers]);
  useEffect(() => { const timer = window.setTimeout(() => void loadBranches(), 0); return () => window.clearTimeout(timer); }, [loadBranches]);
  useEffect(() => { const timer = window.setTimeout(() => void loadDetails(), 0); return () => window.clearTimeout(timer); }, [loadDetails]);

  const cards = useMemo(() => [
    [summary ? String(summary.total) : "—", "Total Customers", "All customer records"],
    [summary ? String(summary.customers_with_active_orders) : "—", "Active Orders", "Customers with active orders"],
    [summary ? String(summary.registered) : "—", "Registered", "Linked customer accounts"],
    [summary ? String(summary.guest) : "—", "Guest", "Customer-only records"],
  ], [summary]);

  const pageNumbers = getPageNumbers(page, lastPage);

  const openCustomer = useCallback((customer: AdminCustomer) => {
    setSelectedId(customer.id);
    setSelectedCustomer(null);
    setDetailError(null);
  }, []);

  const openEditor = useCallback(() => {
    if (!selectedCustomer) return;
    setForm({
      name: selectedCustomer.name,
      email: selectedCustomer.email,
      contact_number: selectedCustomer.contact ?? "",
      address: selectedCustomer.address ?? "",
    });
    setFormErrors({});
    setEditor(selectedCustomer);
  }, [selectedCustomer]);

  const saveCustomer = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editor) return;
    setSaving(true);
    setFormErrors({});
    try {
      await updateAdminCustomer(token, editor.id, form);
      setEditor(null);
      await Promise.all([loadCustomers(), loadDetails()]);
    } catch (requestError) {
      setFormErrors(getCustomerValidationErrors(requestError));
      setError(getAdminCustomerErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }, [editor, form, loadCustomers, loadDetails, token]);

  const removeCustomer = useCallback(async () => {
    if (!token || !deleteTarget) return;
    try {
      await deleteAdminCustomer(token, deleteTarget.id);
      setDeleteTarget(null);
      setSelectedId(null);
      setSelectedCustomer(null);
      await loadCustomers();
    } catch (requestError) {
      setError(getAdminCustomerErrorMessage(requestError));
      setDeleteTarget(null);
    }
  }, [deleteTarget, loadCustomers, token]);

  const changeAccountStatus = useCallback(async () => {
    if (!token || !accountStatusTarget || accountStatusTarget.type !== "registered") {
      return;
    }

    const nextStatus = accountStatusTarget.account?.status === "active"
      ? "inactive"
      : "active";

    setChangingAccountStatus(true);
    setError(null);

    try {
      await updateAdminCustomer(token, accountStatusTarget.id, {
        status: nextStatus,
      });
      setAccountStatusTarget(null);
      await Promise.all([loadCustomers(), loadDetails()]);
    } catch (requestError) {
      setError(getAdminCustomerErrorMessage(requestError));
    } finally {
      setChangingAccountStatus(false);
    }
  }, [accountStatusTarget, loadCustomers, loadDetails, token]);

  const selectFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">Customer Management</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0B1930] sm:text-3xl">Customer Records</h1><p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">Review real customer activity, order history, and account type across all branches.</p></div><button type="button" onClick={() => void loadCustomers()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><FontAwesomeIcon icon={faRefresh} aria-hidden="true" /> Refresh</button></section>
      {error && <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={() => void loadCustomers()} className="font-semibold underline">Retry</button></div>}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{cards.map(([value, title, description]) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-3xl font-bold text-[#0B1930]">{value}</p><h2 className="mt-1 font-semibold text-[#0B1930]">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></article>)}</section>
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row"><input aria-label="Search customers" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search name, email, or contact" className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-orange-500" /><select aria-label="Customer type" value={type} onChange={(event) => selectFilter(setType, event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"><option value="">All types</option><option value="registered">Registered</option><option value="guest">Guest</option></select><select aria-label="Branch activity" value={branchId} onChange={(event) => { setBranchId(event.target.value ? Number(event.target.value) : ""); setPage(1); }} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"><option value="">All branches</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select><select aria-label="Account status" value={status} onChange={(event) => selectFilter(setStatus, event.target.value)} className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm"><option value="">All account status</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-semibold text-[#0B1930]">Customer List</h2>
            <p className="text-sm text-slate-500">
              {summary ? `${summary.total} matching records` : "Loading records..."}
            </p>
          </div>
          <span className="text-sm text-slate-500">Page {page} of {lastPage}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="w-14 px-5 py-3">#</th>
                <th scope="col" className="px-5 py-3">Customer</th>
                <th scope="col" className="px-5 py-3">Type</th>
                <th scope="col" className="px-5 py-3">Contact</th>
                <th scope="col" className="px-5 py-3">Branch activity</th>
                <th scope="col" className="px-5 py-3">Orders</th>
                <th scope="col" className="px-5 py-3">Last order</th>
                <th scope="col" className="px-5 py-3">Status</th>
                <th scope="col" className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-14 text-center text-slate-500">Loading customer records...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-14 text-center text-slate-500">No customer records match these filters.</td></tr>
              ) : (
                customers.map((customer, index) => (
                  <tr key={customer.id} className="transition hover:bg-slate-50/80">
                    <td className="px-5 py-4 font-semibold text-slate-400">{(page - 1) * perPage + index + 1}</td>
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{customer.initials}</span><span><b className="block text-[#0B1930]">{customer.name}</b><small className="text-slate-500">{customer.email || "No email"}</small></span></div></td>
                    <td className="px-5 py-4"><AdminBadge>{label(customer.type)}</AdminBadge></td>
                    <td className="px-5 py-4 text-slate-600">{customer.contact || "Not available"}</td>
                    <td className="px-5 py-4 text-slate-600">{customer.branches.length ? customer.branches.map((branch) => branch.name).join(", ") : "No activity"}</td>
                    <td className="px-5 py-4 font-semibold text-[#0B1930]">{customer.orders}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(customer.last_order_at)}</td>
                    <td className="px-5 py-4"><AdminBadge>{label(customer.account_status ?? "guest")}</AdminBadge></td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openCustomer(customer)}
                        className="min-h-9 rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span className="text-slate-500">
            Showing {totalCustomers === 0 ? 0 : (page - 1) * perPage + 1}–{Math.min(page * perPage, totalCustomers)} of {totalCustomers}
          </span>
          {lastPage > 1 && (
            <nav className="flex flex-wrap items-center justify-end gap-1" aria-label="Customer pages">
              <button type="button" aria-label="Previous customer page" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              {pageNumbers.map((pageNumber, index) => pageNumber === "ellipsis" ? <span key={`ellipsis-${index}`} className="px-2 text-slate-400">…</span> : <button key={pageNumber} type="button" aria-current={pageNumber === page ? "page" : undefined} disabled={loading} onClick={() => setPage(pageNumber)} className={`min-w-9 rounded-lg border px-3 py-2 font-semibold ${pageNumber === page ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{pageNumber}</button>)}
              <button type="button" aria-label="Next customer page" disabled={page >= lastPage || loading} onClick={() => setPage((value) => Math.min(lastPage, value + 1))} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </nav>
          )}
        </div>
      </section>
      {selectedId !== null && <CustomerDetailsModal customer={selectedCustomer} loading={detailLoading} error={detailError} onClose={() => { setSelectedId(null); setSelectedCustomer(null); }} onEdit={openEditor} onDelete={() => selectedCustomer && setDeleteTarget(selectedCustomer)} onAccountStatus={() => selectedCustomer && setAccountStatusTarget(selectedCustomer)} />}
      {editor && <CustomerFormModal customer={editor} form={form} errors={formErrors} saving={saving} onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))} onSubmit={saveCustomer} onClose={() => setEditor(null)} />}
      {accountStatusTarget && <CustomerAccountStatusModal customer={accountStatusTarget} isSubmitting={changingAccountStatus} onClose={() => setAccountStatusTarget(null)} onConfirm={() => void changeAccountStatus()} />}
      {deleteTarget && <BranchModalShell isOpen eyebrow="Customer Management" title="Delete guest customer" description={`Delete ${deleteTarget.name} permanently?`} titleId="admin-customer-delete-title" descriptionId="admin-customer-delete-description" onClose={() => setDeleteTarget(null)} footer={<div className="flex w-full justify-end gap-3"><button type="button" onClick={() => setDeleteTarget(null)} className="admin-order-modal-button admin-order-modal-button-secondary">Cancel</button><button type="button" onClick={() => void removeCustomer()} className="admin-order-modal-button admin-order-modal-button-danger">Delete customer</button></div>}><div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Only an unused guest record can be hard-deleted. Registered accounts and customers referenced by orders or conversations must be retained.</div></BranchModalShell>}
    </div>
  );
}
