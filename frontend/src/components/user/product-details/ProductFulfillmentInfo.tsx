import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleInfo,
  faStore,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";

export default function ProductFulfillmentInfo() {
  return (
    <section
      className="product-details-fulfillment"
      aria-labelledby="product-details-fulfillment-title"
    >
      <h2 id="product-details-fulfillment-title">Fulfillment Options</h2>

      <div className="product-details-fulfillment-list">
        <article className="product-details-fulfillment-item">
          <span className="product-details-fulfillment-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faStore} />
          </span>
          <div>
            <h3>Store Pickup</h3>
            <p>
              Choose a preferred ALD branch during the order-request process.
              Staff confirms availability before preparation.
            </p>
          </div>
        </article>

        <article className="product-details-fulfillment-item">
          <span className="product-details-fulfillment-icon" aria-hidden="true">
            <FontAwesomeIcon icon={faTruck} />
          </span>
          <div>
            <h3>Lalamove Delivery</h3>
            <p>
              Request delivery after staff confirms availability, address, and
              delivery fee. Booking is arranged after confirmation.
            </p>
          </div>
        </article>
      </div>

      <p className="product-details-fulfillment-note">
        <FontAwesomeIcon icon={faCircleInfo} aria-hidden="true" />
        <span>
          Adding a product to the cart does not confirm an order or schedule a
          delivery.
        </span>
      </p>
    </section>
  );
}
