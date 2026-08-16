# Fashion Cart — Tests

## Unit tests (run automatically, no database needed)

```bash
npm test
```

Covers:
- Password hashing (`tests/auth.test.ts`)
- Zod validation schemas — registration, address, UTR, product variants (`tests/validation.test.ts`)
- Price/discount formatting helpers (`tests/format.test.ts`)

## Integration tests (require a real PostgreSQL database)

The core business flows below are implemented as database transactions
(see `lib/orders/create-order.ts`, `lib/inventory/index.ts`,
`app/api/admin/payments/[id]/approve/route.ts`) and are best verified
against a real Postgres instance rather than mocks, since the guarantees
they provide (no overselling, no client-trusted prices, payment can only
be verified by an admin) depend on actual transactional behavior.

To test them by hand after running `npm run db:seed`:

1. **Never trust frontend prices** — Add an item to your cart, then
   call `POST /api/orders` with a tampered `total` in the request body.
   Confirm the created order's `total` matches the server-calculated
   value, not anything sent from the client (the API never reads a
   total from the request in the first place).

2. **Stock cannot be oversold** — Set a variant's stock to 1. Open two
   browser sessions as different customers, add that variant to both
   carts, and checkout from both at (roughly) the same time. Confirm
   only one order succeeds and the other receives an out-of-stock error.

3. **Payment security rule** — Submit a payment screenshot + UTR as a
   customer. Confirm the order status becomes `PAYMENT_REVIEW` and the
   payment becomes `UNDER_REVIEW` — **not** `CONFIRMED`/`VERIFIED`.
   Only after an admin calls "Approve Payment" should the order become
   `CONFIRMED` and an invoice become downloadable.

4. **Duplicate UTR rejection** — Submit the same UTR number for two
   different orders. The second submission should be rejected with a
   409 conflict.

5. **Stock release on cancellation** — Cancel a `CONFIRMED` order from
   the admin panel and confirm the reserved stock is added back to the
   variant (visible in Admin → Inventory and in the `InventoryTransaction`
   table as a `CANCELLED_ORDER` entry).

A future iteration can wire these up as automated integration tests
using a disposable test database (e.g. via `testcontainers` or a CI
Postgres service) rather than manual verification.
