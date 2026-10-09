"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faCartShopping, faCreditCard, faFileLines, faStore, faTruck, faUser } from "@fortawesome/free-solid-svg-icons";
import { AdminBadge } from "@/components/admin/AdminDataTable";
import BranchModalShell from "@/components/admin/branches/BranchModalShell";
import type { AdminOrderDetail, AdminOrderStaffOption } from "@/lib/adminOrderTypes";

function label(value: string | null | undefined) { return value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Not available"; }
function money(value: number) { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value); }
function date(value: string | null) { const parsed = value ? new Date(value) : null; return parsed && !Number.isNaN(parsed.getTime()) ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(parsed) : "Not available"; }

export default function RealOrderDetailsModal({
  order,
  staffOptions,
  saving,
  onClose,
  onStatusChange,
  onAssignmentChange,
}: {
  order: AdminOrderDetail | null;
  staffOptions: AdminOrderStaffOption[];
  saving: boolean;
  onClose: () => void;
  onStatusChange: (status: string) => void;
  onAssignmentChange: (staffId: number | null) => void;
}) {
  const currentStaff = order?.assigned_staff?.id ?? "";
  const hasStatusActions = Boolean(order?.allowed_statuses.length);

  return <BranchModalShell isOpen={order !== null} eyebrow="Order Oversight" title={order?.reference ?? "Order details"} description="Review the canonical order record and supported operational actions." titleId="admin-real-order-title" descriptionId="admin-real-order-description" status={order ? <AdminBadge>{label(order.status)}</AdminBadge> : null} onClose={onClose} footer={order ? <div className="flex w-full justify-end"><button type="button" onClick={onClose} className="admin-order-modal-button admin-order-modal-button-secondary">Close</button></div> : null}>
    {order && <div className="space-y-5">
      <section className="admin-order-modal-section"><div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faUser} aria-hidden="true" /><h3>Customer Information</h3></div><dl className="admin-order-modal-detail-grid"><div><dt>Customer</dt><dd>{order.customer?.full_name ?? "Guest customer"}</dd></div><div><dt>Phone</dt><dd>{order.customer?.contact_number || "Not available"}</dd></div><div><dt>Email</dt><dd>{order.customer?.email || "Not available"}</dd></div><div><dt>Created</dt><dd>{date(order.created_at)}</dd></div></dl></section>
      <section className="admin-order-modal-section"><div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faFileLines} aria-hidden="true" /><h3>Order Information</h3></div><dl className="admin-order-modal-detail-grid admin-order-modal-order-grid"><div><dt>Branch</dt><dd>{order.branch?.name ?? "Not assigned"}</dd></div><div><dt>Fulfillment</dt><dd>{label(order.fulfillment_method)}</dd></div><div><dt>Order total</dt><dd className="admin-order-modal-total">{money(order.total_amount)}</dd></div><div><dt>Updated</dt><dd>{date(order.updated_at)}</dd></div></dl></section>
      <section className="admin-order-modal-section"><div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faCartShopping} aria-hidden="true" /><h3>Order Items</h3></div><div className="admin-order-items-table-wrap"><table className="admin-order-items-table"><thead><tr><th scope="col">Product</th><th scope="col">Qty</th><th scope="col">Unit price</th><th scope="col">Subtotal</th></tr></thead><tbody>{order.items.map((item) => <tr key={`${item.product_id ?? item.name}-${item.part_number ?? "item"}`}><td><div className="flex items-center gap-3">{item.image ? <img src={item.image} alt="" className="size-10 rounded-md object-cover" /> : <span className="grid size-10 place-items-center rounded-md bg-slate-100 text-slate-400"><FontAwesomeIcon icon={faBoxOpen} aria-hidden="true" /></span>}<span><b className="block">{item.name}</b><small className="text-slate-500">{item.part_number ?? "No part number"}</small></span></div></td><td>{item.quantity}</td><td>{money(item.unit_price)}</td><td>{money(item.line_total)}</td></tr>)}</tbody><tfoot><tr><th scope="row" colSpan={3}>Total</th><td>{money(order.total_amount)}</td></tr></tfoot></table></div></section>
      <section className="admin-order-modal-section"><div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faCreditCard} aria-hidden="true" /><h3>Payment Oversight</h3></div><dl className="admin-order-modal-detail-grid admin-order-modal-order-grid"><div><dt>Method</dt><dd>{order.payment ? label(order.payment.method) : "No payment record"}</dd></div><div><dt>Status</dt><dd><AdminBadge>{label(order.payment_status)}</AdminBadge></dd></div><div><dt>Amount</dt><dd>{order.payment ? money(order.payment.amount) : "Not available"}</dd></div><div><dt>Proof</dt><dd>{order.payment?.proof_image_url ? "Submitted" : "Not submitted"}</dd></div></dl></section>
      <section className="admin-order-modal-section"><div className="admin-order-modal-section-title"><FontAwesomeIcon icon={order.fulfillment_method === "pickup" ? faStore : faTruck} aria-hidden="true" /><h3>{order.fulfillment_method === "pickup" ? "Pickup Oversight" : "Delivery Oversight"}</h3></div><dl className="admin-order-modal-detail-grid"><div><dt>Operational status</dt><dd>{label(order.fulfillment_status)}</dd></div>{order.fulfillment_method === "pickup" ? <><div><dt>Pickup branch</dt><dd>{order.pickup?.branch_id === order.branch?.id ? order.branch?.name : "Not available"}</dd></div><div><dt>Pickup date</dt><dd>{order.pickup?.pickup_date ?? "Not scheduled"}</dd></div></> : <><div><dt>Destination</dt><dd>{order.delivery?.address ?? "Not available"}</dd></div><div><dt>Booking</dt><dd>{order.delivery?.booking_reference ?? "Not booked"}</dd></div></>}</dl></section>
      <section className="admin-order-modal-section"><div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faUser} aria-hidden="true" /><h3>Supported Admin Actions</h3></div><div className="admin-order-modal-control-grid"><label className="admin-order-modal-field"><span>Assigned staff</span><select value={currentStaff} disabled={saving} onChange={(event) => onAssignmentChange(event.target.value ? Number(event.target.value) : null)}><option value="">Unassigned</option>{staffOptions.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}</select><small>Only active staff from this order&apos;s branch are available.</small></label><label className="admin-order-modal-field"><span>Next allowed status</span><select value="" disabled={saving || !hasStatusActions} onChange={(event) => { if (event.target.value) onStatusChange(event.target.value); }}><option value="">{hasStatusActions ? "Choose an allowed transition" : "No transition available"}</option>{order.allowed_statuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select><small>Transitions are validated by the canonical order lifecycle.</small></label></div></section>
      {(order.customer_notes || order.staff_notes) && <section className="admin-order-modal-section"><div className="admin-order-modal-section-title"><FontAwesomeIcon icon={faFileLines} aria-hidden="true" /><h3>Notes</h3></div><dl className="admin-order-modal-detail-grid"><div><dt>Customer notes</dt><dd>{order.customer_notes || "None"}</dd></div><div><dt>Staff notes</dt><dd>{order.staff_notes || "None"}</dd></div></dl></section>}
    </div>}
  </BranchModalShell>;
}
