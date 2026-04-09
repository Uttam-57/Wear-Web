# Wear Web

Wear Web is a role-based ecommerce platform built as two applications:

- frontend: customer, seller, and admin web interfaces
- backend: API, business logic, payments, returns, wallet, notifications, analytics

Live site: https://wear-web-nine.vercel.app/

This file documents product behavior and operational flow for each role.

- Frontend setup and implementation: [frontend/README.md](frontend/README.md)
- Backend setup and implementation: [backend/README.md](backend/README.md)

## What the Project Delivers

Wear Web supports full marketplace operations across three connected panels.

### Customer panel

- discovery: browse/search products and variants
- purchase: cart -> checkout -> payment -> confirmation
- post-purchase: order timeline, cancellation window, returns, invoice access
- account: addresses, profile updates, notifications

### Seller panel

- onboarding: seller profile setup and approval state handling
- catalog: create/edit/hold/unhold/delete product listings
- fulfillment: process order statuses in sequence
- returns: handle accepted pickup and later return stages
- finance: wallet view, transaction history, payout requests

### Admin panel

- governance: approve/reject sellers, hold/unhold users
- moderation: hold/unhold/remove products
- operations: order oversight and status override
- returns: process return actions and completion path
- finance control: approve/reject payout requests with settlement/reason metadata

## Repository Layout

```text
Wear Web/
  backend/
  frontend/
```

## Checkout Test Data

Use these values in Stripe test mode:

- Card number: 4242 4242 4242 4242
- Expiry: any valid future month/year
- CVC: any 3 digits
- Postal code: any valid form value

Constraints:

- use only test keys in non-production environments
- never use real card data in dev/staging/test

## End-to-End Platform Flow

1. Admin approves seller account.
2. Seller completes profile and publishes products.
3. Customer selects variants and places order.
4. Customer completes payment.
5. Seller progresses fulfillment statuses.
6. Delivery is confirmed with OTP.
7. Seller wallet reconciliation runs for delivered orders.
8. Customer can raise return after delivery.
9. Return reaches completion and refund path executes.
10. Seller requests payout; admin approves or rejects.

## State Transition Matrix

### Order lifecycle

| Current | Next | Actor | Rule |
| --- | --- | --- | --- |
| placed | accepted | seller | standard fulfillment start |
| placed | rejected | seller | stock restoration path |
| placed | cancelled | customer | cancellation window open |
| accepted | packed | seller | fulfillment |
| accepted | cancelled | customer | cancellation window open |
| packed | shipped | seller | fulfillment |
| shipped | out_for_delivery | seller | fulfillment |
| out_for_delivery | delivered | customer/seller | OTP verification required |
| any | override | admin | admin control path |

### Return lifecycle

| Current | Next | Actor | Rule |
| --- | --- | --- | --- |
| requested | accepted | seller/admin flow | return approved |
| requested | rejected | seller/admin flow | return closed |
| accepted | picked | seller/admin flow | pickup OTP required |
| picked | received | seller/admin flow | item received |
| received | refund_completed | seller/admin flow | refund + wallet adjustment path |

### Payout lifecycle

| Current | Next | Actor | Rule |
| --- | --- | --- | --- |
| pending | approved | admin | wallet debit and settlement path |
| pending | rejected | admin | wallet unchanged |

## Customer Flow (Detailed)

### 1. Discover and select

- browse list/search results
- open product detail and variant options
- add selected variants to cart or wishlist

### 2. Checkout preparation

- choose cart variants for checkout
- select existing address or create/update/delete address
- continue only with valid selection and address

### 3. Payment and confirmation

- order is created from selected variants
- payment intent is created
- Stripe confirmation completes payment
- confirmation page shows order and payment summary

### 4. Post-purchase operations

- timeline tracks fulfillment progress
- cancellation is available only in early states
- delivered orders can move into return workflow

## Seller Flow (Detailed)

### 1. Seller readiness

- seller status must be approved
- seller profile must be complete for protected operations

### 2. Catalog operations

- create and edit listings
- hold/unhold where allowed
- delete listing for permanent removal

Hold behavior:

- account-level or admin-level holds can restrict seller unhold actions

### 3. Fulfillment operations

- strict order progression:
  - placed -> accepted -> packed -> shipped -> out_for_delivery -> delivered
- reject path available only at placed
- delivery completion requires OTP

### 4. Return operations

- process transitions in sequence
- accepted -> picked requires pickup OTP
- received -> refund_completed closes return path

### 5. Wallet and payouts

- monitor balance, pending withdrawals, available amount
- create withdrawal request
- await admin decision

## Admin Flow (Detailed)

### 1. Seller governance

- review pending sellers
- approve or reject with reason

### 2. User governance

- hold/unhold customer or seller
- execute staged delete workflow

Staged delete blockers:

- active orders/returns
- seller wallet balance constraints

### 3. Product moderation

- hold/unhold/remove listings based on compliance requirements

### 4. Order and return control

- review all orders
- apply order status override when required
- process return actions (accept/reject/picked/received/refund_completed)

### 5. Payout control

- review payout queue
- approve with optional settlement reference
- reject with documented reason

## Cross-Module Rules

- order placement deducts stock immediately
- payment failure can cancel linked orders and restore stock
- delivery confirmation can trigger payout reconciliation
- refund completion can reverse previously credited seller earnings
- account hold/delete changes product visibility and available actions
- notifications are emitted for order, return, payment, wallet, and governance events

## OTP and Environment Behavior

- OTP is used in delivery confirmation and return pickup confirmation
- cooldown, expiry, attempt limits, and temporary lock windows are enforced
- in test environment, OTP may be present in API response payloads for automation
- in non-test environment, OTP value is not exposed in normal API responses

## Production Quality Snapshot

Provided audit values:

| Panel | Performance | Best Practices | Accessibility |
| --- | ---: | ---: | ---: |
| Customer | 95 | 98-99 | 98-99 |
| Seller | 96 | 98-99 | 98-99 |
| Admin | 96 | 98-99 | 98-99 |

## Quick Start

```bash
npm --prefix backend install
npm --prefix frontend install
npm --prefix backend run dev
npm --prefix frontend run dev
```

## Release Checklist

- configure production environment variables
- configure backend CORS for deployed frontend origin
- configure Stripe webhook secret
- configure Cloudinary credentials
- verify MongoDB network and credentials
- verify .gitignore protections for secret/generated files
- run backend test suite
- run and verify frontend production build

## Documentation Index

- Project behavior and role flow: this file
- Frontend technical guide: [frontend/README.md](frontend/README.md)
- Backend technical guide: [backend/README.md](backend/README.md)
