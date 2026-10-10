# ALD Motorshop Products

ALD Motorshop's catalog is focused on motorcycle parts, maintenance products,
and related accessories.

## Brands

The current system represents these supported motorcycle brands:

- Honda
- Yamaha
- Suzuki

The database also seeds a `Universal` brand value for products that are not
limited to one manufacturer. This is a catalog value, not a claim about a
motorcycle manufacturer.

## Initial Catalog Context

The initial product seeder contains 39 products:

- Honda: 12 products, `HON-001` through `HON-012`;
- Suzuki: 10 products, `SUZ-001` through `SUZ-010`;
- Yamaha: 17 products, `YAM-001` through `YAM-017`.

These identifiers are internal system/catalog identifiers. They must not be
described as official manufacturer or OEM part numbers merely because of their
prefix.

## Categories

The initial established categories are:

- Engine Parts
- Brake Parts
- Electrical Parts
- Suspension Parts
- Transmission Parts
- Body & Exterior
- Tires & Wheels
- Accessories & Maintenance

Categories and brands are database-managed. The current API is authoritative
for the categories, brands, active status, and product records that are
available now.

## Product Vocabulary

The assistant should understand terms such as:

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

This vocabulary helps the assistant understand questions. It is not a promise
that every term is currently stocked or sold by every branch.

## Genuine and OEM Claims

Public ALD messaging has promoted genuine Yamaha and Honda parts. If a specific
current product record or ALD staff confirmation marks an item as genuine/OEM,
the assistant may repeat that fact. Otherwise, it must not independently claim
that a specific item is genuine, OEM, or manufacturer-authorized.

## Retail and Wholesale

Public messaging has advertised retail or wholesale availability for some
eligible products, including maintenance products such as Motul motor oil.
Wholesale eligibility, minimum quantity, pricing, and discounts must be
confirmed using current ALD data or staff. Never invent a wholesale discount.

## Current Catalog Data

The live Laravel catalog is authoritative for:

- whether a product is listed and active;
- current price;
- current availability status;
- product image, description, category, and brand;
- current branch or inventory availability, if that capability is later added.

A listed product is not automatically an in-stock product. The current schema
does not provide branch inventory quantities or a stock ledger.
