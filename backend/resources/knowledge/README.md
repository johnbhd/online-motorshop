# ALD Motorshop Business Knowledge

This directory contains the first curated business-knowledge pack for the
future **ALD Motorshop Assistant**. The files are written as stable, topic-
focused context that Laravel can retrieve or import in a later AI/RAG task.

This is knowledge content, not a second application database. It does not
implement Groq, retrieval, embeddings, a chatbot endpoint, or conversation
storage.

## Intended Future Architecture

The planned boundary is:

```text
Customer
  -> Next.js chat UI
  -> Next.js assistant proxy/BFF
  -> Laravel assistant API
  -> curated ALD knowledge + live Laravel/PostgreSQL data
  -> Groq language generation
```

The assistant must not answer live operational questions from these Markdown
files alone. Laravel and PostgreSQL remain authoritative for current products,
prices, stock, branches, orders, payments, fulfillment, tracking, and customer
data.

## Authority Order

When information conflicts, use this order:

1. Live Laravel/PostgreSQL data and confirmed backend business rules.
2. This curated knowledge pack.
3. General motorcycle or general-world knowledge.

The repository is authoritative for implemented behavior. The knowledge pack
records stable explanations and carefully labeled public context; it does not
override runtime validation, authorization, or persistence.

## Stable Knowledge vs Live Data

Stable knowledge may include:

- what an Order Request means;
- the distinction between Store Pickup and Lalamove Delivery;
- how guests and registered customers use the system;
- the development-team roles;
- cautious explanations of motorcycle parts and compatibility questions;
- public business context that is explicitly labeled as changeable.

Live data must come from Laravel/PostgreSQL:

- current stock, quantities, and branch availability;
- current product prices, discounts, and wholesale terms;
- current branch hours, status, address, and contact details;
- a customer's identity, order, payment, or message information;
- order, payment, pickup, delivery, rider, and tracking status;
- delivery fees and booking details.

## Files

- `ald-overview.md` - business identity and system purpose.
- `ald-team.md` - the system development team and the owner/founder boundary.
- `ald-branches-contact.md` - known branches, contact information, and hours caveat.
- `ald-products.md` - product scope, brands, categories, vocabulary, and genuine-part boundaries.
- `ald-product-compatibility.md` - compatibility questions and safe-answer rules.
- `ald-order-process.md` - the Order Request lifecycle.
- `ald-payment.md` - payment methods and verification boundaries.
- `ald-pickup-delivery.md` - Store Pickup and staff-arranged Lalamove Delivery.
- `ald-services.md` - verified/general service positioning.
- `ald-order-statuses.md` - repository status values and customer-friendly meanings.
- `ald-customer-accounts.md` - guest, registered, tracking, and privacy rules.
- `ald-faq.md` - concise answers to common customer questions.
- `ald-ai-rules.md` - response behavior, data authority, and no-invention rules.

## What Does Not Belong Here

Do not add:

- passwords, API keys, tokens, database credentials, or private URLs;
- real customer names, phone numbers, addresses, orders, messages, or payment data;
- guessed inventory, pricing, compatibility, delivery fees, or owner information;
- temporary conversation history;
- code for Groq, RAG, embeddings, vector search, or assistant routes;
- a copy of the operational database.

## Future Storage and Retrieval

For the initial MVP, Markdown is the curated source. A later task may move
approved entries into a database table such as `ai_knowledge` with conceptual
fields like `id`, `title`, `category`, `content`, `keywords`, `is_active`,
`created_at`, and `updated_at`. That migration, retrieval layer, and embedding
strategy are intentionally not part of this task.

## Maintenance

Update a statement only when it is supported by the repository, a confirmed
business decision, or a clearly identified public source. Label facts that can
change and prefer live data in future assistant responses. Review the files for
contradictions and unsafe claims before using them as retrieval context.

The public context used for this initial pack was supplied with the
AI-KNOWLEDGE-001 task. One public reference included in that task was [ALD
Motorshop - Main on FindGlocal](https://www.findglocal.com/PH/Manila/106596371621588/ALD-Motorshop---Main).
