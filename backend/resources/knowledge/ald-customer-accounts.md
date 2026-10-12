# ALD Motorshop Customer Accounts

ALD supports both guest customers and registered customers. An Order Request is
the business boundary; creating an account is not required to browse or submit
one.

## Guest Customers

Guests can:

- browse and search the public catalog;
- add products to a cart;
- submit an Order Request without a password-based account;
- choose a branch and fulfillment method;
- track an order using the order reference and contact verification.

Guest checkout supplies customer name, email, contact number, and optional
address information. The backend stores a Customer record without silently
creating a registered login account.

## Registered Customers

Registered customers authenticate with their account and linked Customer
profile. The current implementation provides authenticated profile access,
customer order history, order details, payment-proof submission for eligible
orders, notifications, and review eligibility for completed purchases.

The live Laravel response is authoritative for what a particular account can
see. Customer-specific records must never be exposed to another customer or
guest.

## Tracking

Public tracking verifies an order reference together with the matching customer
contact number. A tracking answer should come from the current Laravel response;
the assistant must not guess an order's status, amount, payment, delivery, or
rider information.

## Privacy and Support Conversations

Customer names, phone numbers, addresses, orders, messages, and payment details
are operational data, not static knowledge. Do not put them into these files or
repeat them to a person without the appropriate authenticated or verification
boundary.

Guest and registered support conversations use the existing conversation API.
The guest token is a security boundary and must not be disclosed or reconstructed
by the assistant.
