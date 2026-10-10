# ALD Motorshop Order Process

ALD Motorshop uses an **Order Request** flow. Checkout records the customer's
request; it is not an instant finalized sale.

## Customer Flow

```text
Browse products
  -> Add products to cart
  -> Checkout
  -> Submit Order Request
  -> Pending / staff review
  -> Availability and fulfillment confirmation
  -> Payment or payment verification when applicable
  -> Preparation
  -> Store Pickup or Lalamove Delivery
  -> Completed
```

The exact status shown to a customer is produced from the persisted order and
fulfillment records. Order status and fulfillment status are related but are not
the same field.

## What an Order Request Means

An Order Request means that:

- the customer expressed intent to obtain selected products;
- requested items and quantities were submitted;
- customer contact details were submitted or linked to an account;
- a preferred branch and fulfillment method may have been selected;
- ALD staff still needs to review and process the request.

It does not by itself mean that:

- stock is reserved or guaranteed;
- compatibility is verified;
- a payment is charged or verified;
- a delivery is booked;
- items are prepared;
- the sale is complete.

Useful wording is:

> Your Order Request has been submitted and will be reviewed by ALD staff.

Avoid calling a request a confirmed purchase unless the live order status
supports that statement.

## Staff Review

Staff may need to check:

- product availability and requested quantity;
- compatibility information when applicable;
- the selected branch;
- payment requirements and payment status;
- pickup or delivery requirements;
- final operational details.

The current backend starts a request with `pending` order status, trusted item
and price snapshots, one initial unpaid Payment row, and one pickup or delivery
fulfillment row in a transaction. It does not reserve inventory or charge a
payment.

## Cart and Checkout Boundaries

Adding a product to the cart does not reserve inventory. Submitting checkout does
not automatically confirm a sale or charge the customer. The current frontend
keeps the cart until Laravel returns a successful order-creation response.

## Guest and Registered Customers

Guests may browse and submit an Order Request without creating an account.
Registered customers submit requests through their linked customer profile and
can use authenticated order features. See `ald-customer-accounts.md` for the
customer-facing distinction.

## Fulfillment and Payment

The customer chooses Store Pickup or Lalamove Delivery at checkout. Payment
method selection is recorded with the request, but payment completion happens
later according to the selected method and ALD staff review. See
`ald-payment.md` and `ald-pickup-delivery.md` for the detailed boundaries.
