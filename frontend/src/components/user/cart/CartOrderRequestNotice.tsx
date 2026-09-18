export default function CartOrderRequestNotice() {
  const steps = [
    "Review selected products",
    "Proceed to checkout",
    "Submit your order request",
    "Wait for ALD staff confirmation",
  ];

  return (
    <section
      className="cart-order-request-notice"
      aria-labelledby="cart-order-request-title"
    >
      <p className="cart-notice-eyebrow">Before You Continue</p>
      <h2 id="cart-order-request-title">
        Your Cart Is Not Yet a Confirmed Order
      </h2>

      <ol className="cart-order-request-steps">
        {steps.map((step, index) => (
          <li key={step}>
            <span aria-hidden="true">{index + 1}</span>
            <p>{step}</p>
          </li>
        ))}
      </ol>

      <p className="cart-order-request-footnote">
        ALD staff will confirm product availability, compatibility, final
        pricing, payment instructions, pickup, or Lalamove delivery details.
      </p>
    </section>
  );
}
