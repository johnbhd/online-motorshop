# ALD Motorshop Frequently Asked Questions

These answers are intentionally concise and cautious. For current operational
facts, the assistant must use live Laravel data.

## What is ALD Motorshop?

ALD Motorshop is a Philippine motorcycle parts and service business. It helps
riders find parts and maintenance products, ask product questions, submit Order
Requests, and arrange Store Pickup or staff-arranged Lalamove Delivery.

## What motorcycle brands does ALD support?

Ask the live catalog for the current active Brand list. Do not rely on a
remembered Brand name or claim that a particular Brand or Product is listed
without a matching live record.

## Do you sell a particular Brand or part?

The assistant must check live Product and Brand data before claiming that a
particular item is listed. A listing does not prove stock, compatibility, or
branch availability.

## Are the parts genuine?

A current Product record or ALD Staff must confirm a genuine or OEM claim. A
Brand name, Product name, or Category does not make every catalog item genuine
or manufacturer-authorized.

## Do you sell motorcycle oil, offer retail, or offer wholesale?

The live catalog and ALD Staff must confirm current maintenance products,
retail or wholesale eligibility, minimum quantities, pricing, and discounts.
The assistant must not invent an offer or a specific Product.

## Does ALD provide motorcycle service?

Yes, ALD publicly advertises motorcycle-related service in addition to parts.
Specific services vary and must be confirmed with the relevant branch or staff.

## Where are the branches and what are the hours?

The assistant retrieves current active Branch records from Laravel. The current
Branch schema does not store business hours, so customers should confirm hours
and contact details with the relevant Branch or ALD Staff.

## How do I place an order?

Browse products, add items to the cart, choose checkout details and fulfillment,
then submit an Order Request. ALD staff reviews the request before confirming
availability, payment requirements, and pickup or delivery details.

## What is an Order Request?

It is a submitted request for ALD staff review, not an automatically completed
sale. It does not guarantee stock, compatibility, payment approval, preparation,
or delivery booking.

## Is checkout an automatic purchase?

No. Checkout creates an Order Request. The current backend initially records the
selected payment method and an unpaid Payment row; it does not automatically
charge the customer or reserve inventory.

## Can I order without an account?

Yes. Guest customers can browse and submit an Order Request. Registered
customers additionally have authenticated account and order features.

## Can I pick up my order?

Store Pickup is available for an active pickup-enabled branch when ALD confirms
the request. Wait for the relevant ready-for-pickup confirmation before visiting.

## Do you offer Lalamove Delivery?

ALD supports Lalamove Delivery requests for eligible orders. ALD staff arranges
the delivery after review and preparation; it is not automatically booked at
checkout.

## How much is delivery?

The assistant must not guess. The current fee depends on the live delivery
details and must be confirmed by ALD staff when it is not present in the Laravel
record.

## Can I pay at pickup?

Pay at Pickup is available for Store Pickup requests. It is not valid for a
Lalamove Delivery request.

## Can I pay using GCash or online payment?

Online Payment is supported as a payment method. Current GCash or QR
instructions come from the live Admin payment settings and must not be
invented. Checkout does not automatically charge the customer.

## How do I know if a part fits my motorcycle?

Provide the motorcycle brand, model, year, variant, engine displacement, and
existing part number when relevant. Catalog brand matching alone does not prove
compatibility; ALD data or staff should confirm the exact fit.

## Can the assistant confirm stock or current price?

Only from current trusted Laravel product data. A static knowledge file cannot
confirm stock, quantity, branch availability, or current price.

## How do I track my order?

Use the order reference and matching customer contact verification through the
tracking flow. The live Laravel response determines the status and details.

## What does Pending mean?

ALD received the request, but staff review may still be pending.

## What does Ready for Pickup mean?

The pickup workflow has reached the ready stage. Follow the current branch and
pickup instructions rather than visiting based only on an earlier request.

## Who developed the ALD Motorshop system?

The system was developed by a four-person project team:

- JB - Tech Lead / Programmer
- Jerzel - Frontend Developer
- Mai - Frontend Designer
- Francis - QA and Researcher

## Who is the Tech Lead, frontend developer, frontend designer, or QA researcher?

JB is the Tech Lead / Programmer, Jerzel is the Frontend Developer, Mai is the
Frontend Designer, and Francis is the QA and Researcher.

## Who owns or founded ALD Motorshop?

The available system knowledge identifies the development team but does not
contain verified ownership or founder information for the real ALD Motorshop
business. The assistant must not infer ownership from the development-team list.
