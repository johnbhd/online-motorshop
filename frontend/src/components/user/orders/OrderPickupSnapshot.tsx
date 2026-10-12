import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faFileLines, faStore } from "@fortawesome/free-solid-svg-icons";
import type { OrderViewPickup } from "@/lib/orders/orderTypes";

type OrderPickupSnapshotProps = {
  pickup: OrderViewPickup | null;
  branchName: string | null;
  orderNotes: string | null;
};

function value(value: string | null | undefined, fallback = "Not available") {
  return value?.trim() ? value : fallback;
}

export default function OrderPickupSnapshot({
  pickup,
  branchName,
  orderNotes,
}: OrderPickupSnapshotProps) {
  if (!pickup) return null;

  return (
    <section className="track-order-card track-order-delivery-snapshot" aria-labelledby="pickup-snapshot-title">
      <div className="track-order-section-heading">
        <div>
          <p className="track-order-section-eyebrow">HISTORICAL ORDER DATA</p>
          <h2 id="pickup-snapshot-title">Store Pickup Details</h2>
        </div>
      </div>
      <dl className="track-order-delivery-snapshot-grid">
        <div className="track-order-delivery-snapshot-wide">
          <dt><FontAwesomeIcon icon={faStore} aria-hidden="true" /> Pickup branch</dt>
          <dd>{value(branchName)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{value(pickup.status)}</dd>
        </div>
        <div>
          <dt><FontAwesomeIcon icon={faCalendarDays} aria-hidden="true" /> Pickup date</dt>
          <dd>{value(pickup.pickupDate)}</dd>
        </div>
        <div>
          <dt>Pickup time</dt>
          <dd>{value(pickup.pickupTime)}</dd>
        </div>
        <div className="track-order-delivery-snapshot-wide">
          <dt><FontAwesomeIcon icon={faFileLines} aria-hidden="true" /> Pickup notes</dt>
          <dd>{value(pickup.notes)}</dd>
        </div>
        {orderNotes?.trim() ? (
          <div className="track-order-delivery-snapshot-wide">
            <dt><FontAwesomeIcon icon={faFileLines} aria-hidden="true" /> Order notes</dt>
            <dd>{orderNotes}</dd>
          </div>
        ) : null}
      </dl>
      <p className="track-order-map-note">Pickup notes and order notes are stored separately with this order request.</p>
    </section>
  );
}
