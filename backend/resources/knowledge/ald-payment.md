# ALD Motorshop Payment

Payment selection is part of an Order Request, but checkout is not an automatic
charge or payment gateway transaction.

## Payment Methods

The current customer-facing methods are:

- **Pay at Pickup** - available for Store Pickup requests;
- **Online Payment** - used for eligible pickup or delivery requests when ALD
  provides instructions.

The backend rejects Pay at Pickup for Lalamove Delivery because the customer is
not collecting the order at the branch.

## Initial Checkout State

The current Laravel order-request flow creates one related Payment row with the
selected method and an initial `unpaid` status. It does not charge the customer,
reserve stock, approve a payment, or book a delivery provider.

Safe wording:

> Your payment method was recorded with the Order Request. ALD staff will review
> the request and provide or confirm the next payment step.

## Online Payment Instructions

Current payment instructions are controlled by Admin settings and exposed to the
customer through the public payment-instructions endpoint. The assistant must
read live instructions when available and must never invent or repeat a guessed:

- GCash number or account name;
- QR code or payment link;
- bank account;
- payment reference;
- payment approval.

If the live payment instructions are not configured or cannot be reached, say
that ALD staff must provide the current payment details.

## Payment Proof and Verification

For an eligible confirmed online-payment order, an authenticated customer may
submit a receipt image. The backend validates the image, stores it through the
configured Cloudinary flow, and changes the Payment to
`waiting_for_verification`. Staff or Admin then reviews the proof and may mark
the payment `paid` or `failed` according to the existing transition rules.

Do not tell a customer that an uploaded receipt is already approved.

## Payment Statuses

The repository represents payment status with values such as `unpaid`,
`waiting_for_payment`, `waiting_for_verification`, `paid`, `failed`, `refunded`,
and `cancelled`. The live Payment record is authoritative for a specific order.

No payment gateway, automatic charging, refund workflow, or external payment
provider integration is established by this knowledge pack.
