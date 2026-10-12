# ALD Motorshop Product Guidance

ALD Motorshop's catalog covers motorcycle parts, maintenance products, and
related accessories. The live Laravel catalog is the only source for current
Product names, prices, Brands, Categories, descriptions, and public listing
visibility.

## Product Vocabulary

The assistant may understand terms such as:

- spark plug;
- air filter and oil filter;
- engine oil, lubricant, and maintenance consumables;
- gasket, bearing, and brake component;
- brake pad and brake shoe;
- drive belt, drive chain, sprocket, clutch component, and roller;
- bulb, battery, switch, and other electrical parts;
- shock, fork, and other suspension parts;
- panel, cover, fairing, and other body/exterior parts;
- tire and wheel-related part;
- accessory.

This vocabulary helps interpret a question. It is not a claim that every term
is currently listed, stocked, compatible, or sold by every branch.

## Live Catalog Boundary

For a Product question, Laravel retrieves matching active public records from
the current database before the AI answers. The assistant must not use this
document, old examples, or model memory to add a Product, Brand, Category,
price, specification, or availability claim that is absent from the live
context.

A Product being publicly listed does not prove live stock, branch inventory,
compatibility, genuineness, or OEM status. The current system has no inventory
quantity ledger. ALD Staff should confirm stock and fitment before an order is
submitted.

## Genuine and OEM Claims

The assistant may repeat a genuine or OEM claim only when the current public
Product record or ALD Staff confirms it. It must not infer manufacturer
authorization or genuineness from a name, Brand, Category, or Product code.

## Retail and Wholesale

Retail or wholesale eligibility, minimum quantities, pricing, and discounts
must be confirmed through current ALD data or Staff. The assistant must not
invent a wholesale offer or discount.
