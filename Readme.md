# ALD Motorshop — Full Project Context

**Web-Based Motorcycle Parts Ordering and Delivery Request Management System for ALD Motorshop**

This document is the single source of truth for the ALD Motorshop system: the business, the architecture, the tech stack, the features, and the frontend migration rules currently in progress.

---

## 1. Project Overview

ALD Motorshop is a motorcycle parts retailer in the Philippines with branches in **Manila, Makati, and Imus**, selling genuine parts primarily for **Honda, Yamaha, and Suzuki** motorcycles.

The business currently relies heavily on social media / Messenger for inquiries, availability checks, payments, and pickup/delivery coordination — this leads to scattered, hard-to-track conversations. The system centralizes all of this into one web platform.

Orders placed on the site are **order requests**, not automatically finalized sales. Staff must confirm product availability, final price, payment, and pickup/delivery before an order is completed — this is not a Shopee-style instant-checkout system.

---

## 2. Current Repository & Migration Stage

```text
online-motorshop/          (single Git repo, no nested .git folders)
├── backend/                Laravel (Blade + Tailwind + vanilla JS) — reference/fallback
└── frontend/                Next.js App Router + React + TypeScript + Tailwind — active migration
```

**Current stage: FRONTEND UI MIGRATION ONLY.**

Not yet in scope (do not add until explicitly requested):
- API integration / Axios calls to Laravel
- Sanctum / JWT authentication
- Supabase integration (DB or Storage)
- Real database CRUD
- Real authentication
- WebSockets / Laravel Echo / Reverb / Supabase Realtime

Migration philosophy: this is a **migration, not a redesign**. The current Laravel code (not old screenshots) is the authoritative source for UI and behavior. Preserve visual appearance and functional behavior exactly while converting to React/TypeScript.

Laravel stays **read-only** during this stage — do not modify backend code unless explicitly asked.

---

## 3. Final Production Architecture

```text
User
 ↓
Next.js (Vercel)
 ↓
Laravel API (Render)
 ↓
Supabase PostgreSQL + Supabase Storage
```

- **Vercel** — hosts the Next.js frontend (root directory = `frontend/`)
- **Render** — hosts the Laravel API (deployed from repo root: `composer install --no-dev`, config/route/view cache, `php artisan migrate --force`)
- **Supabase** — PostgreSQL database + file storage
- **GitHub** — single repo, source of truth, deployment source

Migration reason: Laravel Blade pages hosted on Render had noticeable load delay, so the frontend moved to Next.js on Vercel while Laravel remains the API backend on Render.

### Supabase Storage buckets
```text
products
payment-proofs   (private — sensitive)
reviews
chat-attachments
website-media
```

### Example API endpoints (Laravel, for later integration)
```text
/api/products, /api/products/{id}
/api/orders, /api/orders/{id}
/api/customers
/api/payments
/api/pickups
/api/deliveries
/api/messages
/api/reviews
/api/branches
/api/auth/login, /api/auth/register, /api/auth/logout
```

---

## 4. User Types

| Type | Account? | Can do |
|---|---|---|
| **Guest Customer** | No — has a `customers` record with `user_id = NULL` | Browse, search, filter, checkout, order, track via order reference + contact/email verification, use website chat |
| **Registered Customer** | Yes — `users` record with email/password, linked via `customers.user_id` | Everything a guest can, plus login, saved profile, full order history, multiple order tracking, product reviews, saved checkout info. Optional Google OAuth later |
| **Staff** | Yes | Branch-level order/payment/pickup/delivery/customer/review/message handling. **Cannot** change customer passwords, roles, or delete accounts; **cannot** do refunds, overrides, or disputes (admin-only) |
| **Administrator** | Yes | Full access: staff management, branch management, website content, AI chatbot config, reports, activity logs, settings |

**Key rule:** a `customers` record does not automatically mean a user account. Guest orders always create or reuse a customer record — never silently create a password-based account. After an order, the customer is offered (not forced) the option to create an account to link past orders.

### Authorization model (enforced via Laravel middleware/policies, not just hidden UI)
```text
Public routes      → Guest
/customer/*         → Registered Customer
/staff/*             → Staff + Admin
/admin/*             → Admin only
```

---

## 5. Public Site Pages

Home, Products, Product Details, Cart, Checkout, Order Confirmation, Track Order, About Us, Branches, Contact Us, FAQs, Reviews, Blog, Reels/FYP, Login, Register.

**Main nav (kept simple):** Home · Products · Track Order · About Us · Branches · Contact Us · FAQs · Cart
(Product Details, Checkout, and Order Confirmation are workflow pages — no navbar links needed.)

---

## 6. Branches

| Branch | Address |
|---|---|
| Manila | 3333 New Panaderos, Sta. Ana, Manila, 1016 Metro Manila |
| Makati | 3678 Bautista Street, Makati City |
| Imus | LYS Building, General Aguinaldo Highway, Imus, 4103 Cavite |

**Main contact:** +63 995 869 1174

Do not invent additional branches, business hours, or contact details.

---

## 7. Products & Compatibility

```text
Brand → Motorcycle Model → Product Compatibility → Product
```
Example: Honda → Click 125 → Brake Pad

**Product availability statuses:**
```text
Available
Subject to Confirmation
Low Stock
Out of Stock
Unavailable
Archived
```

Recommendation engine is initially **rule-based** (by brand/model/category), not AI-driven.

---

## 8. Order, Payment & Delivery Flow

### Order flow
```text
Browse → Cart → Checkout → Submit Order → Pending → Staff Review →
Confirm Availability → Payment → Preparing → Pickup/Delivery → Completed
```

### Order statuses
```text
Pending, Under Review, Confirmed, Waiting for Payment, Payment Verification,
Preparing Order, Ready for Pickup, Booked for Delivery, Picked Up by Rider,
Completed, Rejected, Cancelled
```

### Payment statuses
```text
Unpaid, Waiting for Payment, Waiting for Verification, Paid, Failed, Refunded, Cancelled
```
Staff and Admin can verify normal payments; **refunds, overrides, corrections, and disputes are Admin-only.**

### Delivery statuses
```text
Delivery Requested, Waiting for Booking, Booked with Lalamove, Rider Assigned,
Picked Up, In Transit, Delivered, Failed Delivery, Cancelled
```

### Fulfillment options
- **Store Pickup** — customer presents order reference at branch
- **Lalamove Delivery** — for MVP, this is **manual staff booking** (no Lalamove API required). Staff records: delivery fee, booking number, rider, rider contact, tracking link, booking/pickup/delivery times, status.

---

## 9. Messaging & AI Chatbot

```text
Customer → Website Chat → AI Chatbot
                             ├── Confident? → AI answers directly
                             └── Not confident? → Escalates to correct branch's staff inbox
```

Messenger is **not** the primary channel — communication stays inside the website. The AI must never invent uncertain product availability or compatibility information; when unsure, it escalates to a human.

Staff message statuses: `New, Open, Waiting for Customer, Transferred, Resolved, Closed`

---

## 10. Reviews

Registered customers can review **completed, verified-purchase** orders. Staff/Admin can moderate (reply, flag, hide) but **cannot permanently delete** reviews.

---

## 11. Reports & Activity Logs

Reports cover: orders, payments, products, pickup/delivery fulfillment, customers, staff activity.

Activity logs track actions like payment verification/rejection, refunds, order status changes, price/availability updates, staff/branch changes, review moderation — logging `user_id, action, module, record_id, old_value, new_value, created_at`.

---

## 12. Security Requirements

HTTPS · Laravel validation · CSRF protection · auth middleware/policies · hashed passwords · rate limiting/login throttling · SQL injection & XSS protection · file type/size validation · private storage for sensitive uploads (e.g. payment proofs) · activity logging.

**Never expose in frontend / `NEXT_PUBLIC_*` code:**
```text
DB_PASSWORD
SUPABASE_SERVICE_ROLE_KEY
APP_KEY
AI_API_KEY
```

---

## 13. Build Order & MVP Priority

### Recommended build order
```text
Architecture → Supabase/Postgres → Laravel API → Auth → Roles →
Branches → Products/Categories/Brands/Models → Guest Customer →
Registered Customer → Cart → Checkout → Orders → Payments → Pickup →
Delivery → Tracking → Staff Dashboard → Admin Dashboard →
Customer History → Reviews → Messaging → AI Chatbot → Blog/Reels → Reports
```

### MVP priority (build first)
Products, Guest Ordering, Registered Customer, Cart, Checkout, Orders, Payments, Pickup, Delivery, Tracking, Staff, Admin.

### Comes after MVP
Reviews, Messaging, AI Chatbot, Recommendations, Blog, Reels, Advanced Analytics, Lalamove API integration.

### Decision-making priority order
1. Security
2. Clean Laravel API architecture
3. Clean Next.js frontend architecture
4. Proper authorization
5. Maintainability
6. Practical MVP scope
7. Low-cost hosting
8. Good UX
9. Database integrity
10. Easy future scaling

Avoid overengineering.

---

## 14. Next.js Frontend Architecture Rules

**Core principle:**
```text
app/          = routing only
components/    = actual UI
public/         = static assets only
```

Never replicate Laravel's `views/`, `layouts/`, `partials/`, `resources/` folder structure inside `frontend/`.

### Route files stay thin
```tsx
// app/staff/orders/page.tsx
import OrdersPage from "@/components/staff/orders/OrdersPage";

export default function Page() {
  return <OrdersPage />;
}
```
Actual implementation lives in `components/staff/<feature>/XPage.tsx` or `components/admin/<feature>/XPage.tsx` — **one file per feature**, never combined multi-page files (a past refactor split apart a single file that had `OrdersPage()`, `ProductsPage()`, `CustomersPage()` etc. together — do not reintroduce that pattern).

### Shared components
- **Staff:** `StaffShell`, `StaffSidebar`, `StaffNavbar`, `StaffPageHeader`, `PortalTable`, `Summary`, `ActionButton`
- **Admin:** `AdminShell`, `AdminSidebar`, `AdminNavbar`
- **Public site:** `components/layout/Navbar.tsx`, `Footer.tsx` (not `components/public/`)
- **Auth:** UI in `components/auth/` (UI-only, no real auth yet), routes at `app/auth/login`, `app/auth/register`

### Site/public pages
Use the `app/(site)/` route group (doesn't appear in the URL) with shared layout in `components/layout/`.

### "use client" rule
Keep `page.tsx` / `layout.tsx` as Server Components whenever practical. Only mark truly interactive components as Client Components: sidebars, navbars, tables, filters, tabs, modals, message composer, charts, password visibility toggles. Use the smallest reasonable client boundary.

### React conversion rule
Convert Laravel's vanilla JS DOM manipulation into proper React patterns:
- Avoid: `querySelector`, `getElementById`, `innerHTML`, `appendChild`, `classList.toggle`
- Use: `useState`, `useMemo`, `useEffect` (when necessary), props, event handlers, conditional rendering

---

## 15. Staff Structure

### Routes
```text
/staff                    (dashboard — do NOT create /staff/dashboard)
/staff/orders
/staff/payments
/staff/pickup-requests
/staff/delivery-requests
/staff/products
/staff/messages
/staff/notifications
/staff/customers
/staff/reviews
/staff/reports
```

### Component structure
```text
components/staff/
├── StaffShell.tsx
├── StaffSidebar.tsx
├── StaffNavbar.tsx
├── StaffPageHeader.tsx
├── PortalTable.tsx
├── Summary.tsx
├── ActionButton.tsx
├── dashboard/StaffDashboardPage.tsx
├── orders/OrdersPage.tsx
├── payments/PaymentsPage.tsx
├── pickup-requests/PickupRequestsPage.tsx
├── delivery-requests/DeliveryRequestsPage.tsx
├── products/ProductsPage.tsx
├── messages/MessagesPage.tsx
├── notifications/NotificationsPage.tsx
├── customers/CustomersPage.tsx
├── reviews/ReviewsPage.tsx
└── reports/ReportsPage.tsx
```

### Staff Messages
The **current implementation is the source of truth** (manually refined after earlier design prompts). Preserve: conversation list, selected conversation, message bubbles, composer, internal scrolling, mobile list→conversation switching. No Echo/Reverb/WebSockets/Supabase Realtime yet.

### Staff data
Uses local typed mock data (e.g. `lib/mock/staff.ts`) — keep as-is. No `setTimeout()` fake-loading skeletons.

---

## 16. Admin Structure

Migration split into two parts — **only migrate pages that actually exist in the current project**, don't invent missing ones.

**Admin Part 1:** `/admin`, `/orders`, `/payments`, `/pickup-requests`, `/delivery-requests`, `/products`
**Admin Part 2:** `/customers`, `/messages`, `/reviews`, `/branches`, `/staff-management`, `/website-content`, `/reports`, `/activity-logs`, `/settings`, `/profile`, `/notifications`

### Component structure
```text
components/admin/
├── AdminShell.tsx
├── AdminSidebar.tsx
├── AdminNavbar.tsx
├── orders/OrdersPage.tsx
├── payments/PaymentsPage.tsx
├── customers/CustomersPage.tsx
├── messages/MessagesPage.tsx
├── branches/BranchesPage.tsx
├── staff-management/StaffManagementPage.tsx
└── website-content/WebsiteContentPage.tsx
```

### Details panel rule
Do **not** reintroduce permanent right-side details panels that were removed from the final UI — especially on Admin Orders, Payments, Pickup Requests, Delivery Requests, Customers, Branches, Staff Management, Website Content. Use full-width table/card/editor layouts. `View`/`Manage`/`Edit` buttons can remain placeholder-only — don't auto-build modals for them.

### Website Content
No permanent "Homepage Preview" side panel — use a full-width editor. Hero Image stays an empty placeholder (don't generate/download images).

---

## 17. Styling

**Palette:** deep navy/near-black · ALD orange-gold · white · light gray
**Primary buttons:** orange background + **white** text
Preserve existing spacing, cards, tables, shadows, border radius, nav, sidebar, and responsive design exactly as in the current Laravel Blade UI.

### CSS file organization (professional Next.js convention for this project)
```text
frontend/
├── app/
│   ├── layout.tsx
│   ├── styles/
│   │   ├── globals.css       ← Tailwind directives, CSS variables, resets (imported once in layout.tsx)
│   │   ├── about.css          ← page-specific styles, imported only where used
│   │   ├── auth.css
│   │   └── components.css     ← shared custom component classes
│   └── ...routes
├── components/
└── public/
```
- `globals.css` is the only file imported globally (in `app/layout.tsx`).
- Page-specific CSS files are imported directly in the component that needs them (e.g. `about.css` imported in `components/site/about/AboutPage.tsx`), not globally — mirrors Laravel only loading `about.css` on the About page.
- These are plain CSS imports (not CSS Modules), so class names are global — prefix selectors per file (e.g. `.about-hero`, `.auth-card`) to avoid collisions.
- Most styling should still just be inline Tailwind utility classes; use these separate CSS files only when a page has enough custom CSS to justify it (this `styles/` folder is acceptable since it's flat and holds only stylesheets — it does not replicate Blade's `views/layouts/partials` structure).

---

## 18. Assets

Laravel assets live in `backend/public/`; Next.js assets go in `frontend/public/` (static files only). Copy only what's needed, check for existing duplicates first — don't copy everything blindly.

---

## 19. Dependencies

Avoid installing unnecessary packages. Reuse Chart.js if already installed (for Reports). Charts should be isolated Client Components — don't make the whole Reports page a Client Component just because a chart needs the browser.
