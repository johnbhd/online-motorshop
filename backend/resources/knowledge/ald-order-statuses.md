# ALD Motorshop Order and Fulfillment Statuses

The Laravel backend stores order, payment, pickup, and delivery statuses as
separate string values. The live record is authoritative for a particular
customer request.

## Order Status Values

The current backend order vocabulary includes:

| Backend value | Customer-friendly meaning |
| --- | --- |
| `pending` | The request was received and is waiting for review. |
| `under_review` | ALD staff is checking the request and operational details. |
| `confirmed` | Staff accepted the request for further processing. |
| `waiting_for_payment` | The request is waiting for the applicable payment step. |
| `payment_verification` | A payment or payment proof is being reviewed. |
| `preparing_order` | Staff is preparing the confirmed items. |
| `ready_for_pickup` | The order has reached the pickup-ready stage. |
| `booked_for_delivery` | The order has a delivery-booking stage in the order workflow. |
| `picked_up_by_rider` | The delivery workflow records rider pickup. |
| `waiting_for_booking` | The delivery request is waiting for manual booking work. |
| `completed` | The order process is complete. |
| `rejected` | ALD did not accept the request for processing. |
| `cancelled` | The request was cancelled. |

The backend keeps the order status separate from the fulfillment status. A
customer-facing display status may reflect pickup progress when a confirmed
pickup order is preparing, ready, or completed.

## Pickup Status Values

Pickup records use:

- `pending` - pickup request has been created;
- `preparing` - staff is preparing the order;
- `ready_for_pickup` - customer collection can proceed after the relevant
  confirmation;
- `completed` - pickup was completed;
- `cancelled` - pickup was cancelled.

## Delivery Status Values

Delivery records use:

- `waiting_for_booking`;
- `booked`;
- `picked_up`;
- `in_transit`;
- `delivered`;
- `failed`;
- `cancelled`.

These values describe the persisted manual delivery workflow. They do not prove
that an automated Lalamove provider integration exists.

## Payment Status Values

Payment records use `unpaid`, `waiting_for_payment`,
`waiting_for_verification`, `paid`, `failed`, `refunded`, and `cancelled`.

Never infer a current status from an old notification, a static example, or a
customer's expectation. Read the current Laravel order and related fulfillment
and payment records.
