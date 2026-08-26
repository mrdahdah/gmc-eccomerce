# FEATURE-004 - Shopping Cart

**Owner:** Student 4 · **Priority:** High

Implement add/remove/update/clear, subtotal calculation and authenticated cart persistence from PostgreSQL to React. Acceptance: quantities are validated, totals use server prices, users only access their cart, mutations update cached data, and the cart UI handles empty/loading/error states.

---

## Implementation notes (branch `feature/shopping-cart`)

**Database:** no new migration — `Cart` (one per user) and `CartItem` (`@@unique([cartId, productId])`)
are already in the base schema.

**Backend / API** (`apps/server/src/cart/`), every route behind `JwtAuthGuard` and scoped to
`req.user.id` so a user only ever touches their own cart:
- `GET /api/cart` — cart with server-computed line totals + subtotal (never trusts client prices).
- `POST /api/cart/items` — add `{ productId, quantity? }` (increments if already present).
- `PATCH /api/cart/items/:productId` — set an absolute quantity.
- `DELETE /api/cart/items/:productId` — remove a line · `DELETE /api/cart` — clear.
- `GET /api/cart/catalog` — read-only product list so the cart UI is usable before FEATURE-002.
- Quantity is validated by DTOs (`@IsInt`, `@Min(1)`, `@Max(999)`) and against live product stock
  (`400` when exceeded); unknown product → `404`; updating a line not in your cart → `404`.
- Unit tests: `cart.service.spec.ts` (subtotal math, empty cart, stock guard, ownership).

**Frontend — storefront** (`apps/client/src/features/cart/`): a **Cart** page (`/cart`) with
quantity steppers, remove, clear, live subtotal, an "add products" strip, and explicit
empty/loading/error/signed-out states. `cartApi` RTK Query slice registered in the store; every
mutation `invalidatesTags: ['Cart']` so the cached cart refreshes automatically. Nav "Cart" link added.

**Checks:** requires `pnpm install` + Postgres (`docker compose up -d`, `pnpm db:migrate`,
`pnpm db:seed`) end-to-end; server unit tests run via `pnpm --filter @ecommerce/server test`.
