import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot, faPhone, faUser } from "@fortawesome/free-solid-svg-icons";
import type { OrderViewDelivery } from "@/lib/orders/orderTypes";

type OrderDeliverySnapshotProps = {
  delivery: OrderViewDelivery | null;
};

function value(value: string | null | undefined, fallback = "Not available") {
  return value?.trim() ? value : fallback;
}

export default function OrderDeliverySnapshot({ delivery }: OrderDeliverySnapshotProps) {
  if (!delivery) return null;

  return (
    <section className="track-order-card track-order-delivery-snapshot" aria-labelledby="delivery-snapshot-title">
      <div className="track-order-section-heading">
        <div>
          <p className="track-order-section-eyebrow">HISTORICAL ORDER DATA</p>
          <h2 id="delivery-snapshot-title">Lalamove Delivery Details</h2>
        </div>
      </div>
      <dl className="track-order-delivery-snapshot-grid">
        <div className="track-order-delivery-snapshot-wide">
          <dt><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /> Delivery address</dt>
          <dd>{value(delivery.completeAddress ?? delivery.address)}</dd>
        </div>
        <div>
          <dt>Barangay</dt>
          <dd>{value(delivery.barangay)}</dd>
        </div>
        <div>
          <dt>City / Municipality</dt>
          <dd>{value(delivery.cityMunicipality)}</dd>
        </div>
        <div>
          <dt><FontAwesomeIcon icon={faUser} aria-hidden="true" /> Contact person</dt>
          <dd>{value(delivery.contactPerson)}</dd>
        </div>
        <div>
          <dt><FontAwesomeIcon icon={faPhone} aria-hidden="true" /> Contact number</dt>
          <dd>{value(delivery.contactNumber)}</dd>
        </div>
        <div className="track-order-delivery-snapshot-wide">
          <dt>Delivery notes</dt>
          <dd>{value(delivery.notes)}</dd>
        </div>
      </dl>
      <p className="track-order-map-note">These delivery details were saved with this order. Later profile changes do not change this snapshot.</p>
    </section>
  );
}
