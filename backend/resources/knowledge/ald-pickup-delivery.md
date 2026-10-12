# Store Pickup and Lalamove Delivery

ALD Motorshop supports two fulfillment directions in the current order-request
flow: Store Pickup and Lalamove Delivery.

## Store Pickup

The conceptual flow is:

```text
Order Request
  -> ALD staff review and confirmation
  -> order preparation
  -> Ready for Pickup
  -> customer collection at the selected branch
  -> Completed
```

The customer should wait for the appropriate confirmation and ready-for-pickup
status before visiting the branch. Submitting an Order Request does not mean the
items are already prepared or waiting at the counter.

The current pickup record uses statuses including `pending`, `preparing`,
`ready_for_pickup`, `completed`, and `cancelled`. The selected branch and live
pickup availability come from Laravel.

## Lalamove Delivery

The conceptual flow is:

```text
Order Request
  -> ALD staff review and confirmation
  -> order preparation
  -> ALD staff arranges Lalamove
  -> rider pickup
  -> delivery
  -> Completed
```

Lalamove is currently **manual staff arrangement**. The current repository does
not contain a Lalamove SDK/API integration or automatic rider assignment. Do not
promise that checkout automatically books a rider.

The delivery record can contain a manually recorded booking reference, tracking
URL, rider name, rider contact, delivery fee, remarks, and delivery status. A
stored value is not proof that a live provider booking is active unless the
backend/staff record confirms it.

## Delivery Fee

The assistant must not guess a delivery fee. Cost may depend on origin,
destination, distance, current delivery pricing, and delivery conditions. If the
live system has not supplied a fee, say that ALD staff must confirm it.

## Payment and Delivery

Lalamove Delivery cannot use Pay at Pickup. Online-payment requirements are
reviewed separately, and delivery booking remains a staff operation. Payment
status, delivery status, booking data, and tracking data must come from the live
Laravel records.
