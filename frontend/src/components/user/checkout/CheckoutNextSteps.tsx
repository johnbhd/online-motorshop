import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardCheck,
  faFileLines,
  faTruck,
} from "@fortawesome/free-solid-svg-icons";

const nextSteps = [
  {
    id: "submit",
    label: "Submit Request",
    description: "Your details and selected products are saved for review.",
    icon: faFileLines,
  },
  {
    id: "confirmation",
    label: "Staff Confirmation",
    description: "ALD confirms availability, amount, payment, and fulfillment.",
    icon: faClipboardCheck,
  },
  {
    id: "fulfillment",
    label: "Pickup or Delivery",
    description: "The confirmed request is prepared for pickup or delivery.",
    icon: faTruck,
  },
];

export default function CheckoutNextSteps() {
  return (
    <section
      className="checkout-next-steps"
      aria-labelledby="checkout-next-steps-title"
    >
      <h2 id="checkout-next-steps-title">What Happens Next?</h2>
      <div className="checkout-next-steps-grid">
        {nextSteps.map((step, index) => (
          <div className="checkout-next-step" key={step.id}>
            <div className="checkout-next-step-icon" aria-hidden="true">
              <FontAwesomeIcon icon={step.icon} />
              <span>{index + 1}</span>
            </div>
            <strong>{step.label}</strong>
            <p>{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
