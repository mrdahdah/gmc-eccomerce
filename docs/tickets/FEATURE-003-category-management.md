# FEATURE-003 - Category Management

**Owner:** Student 3 · **Priority:** Medium

Build category CRUD for admins plus public category listing and products-by-category. Acceptance: only admins mutate categories, names/slugs are unique, DTO validation is present, RTK Query invalidates affected lists, and both admin/public UI paths work.

---

## Implementation notes (branch `feature/category-management`)

**Database:** no new migration — the base schema already models `Category` (unique `name` and
`slug`) and its `Product[]` relation.

**Backend / API** (`apps/server/src/categories/`):
- `GET /api/categories` — public list, each with a `productCount`.
- `GET /api/categories/:slug` — public single category.
- `GET /api/categories/:slug/products` — public products-by-category.
- `POST /api/categories` · `PATCH /api/categories/:id` · `DELETE /api/categories/:id` — admin only
  (`JwtAuthGuard` + `RolesGuard` + `@Roles(Role.ADMIN)`).
- DTO validation via `class-validator` (`CreateCategoryDto`, `UpdateCategoryDto`); slug is derived
  from the name when omitted and must match `^[a-z0-9-]+$`.
- Name/slug uniqueness returns a clean `409 Conflict` (not a raw Prisma error); deleting a category
  that still has products is refused with `409`.
- Unit tests: `categories.service.spec.ts` (slug derivation, duplicate rejection, delete guard).

**Frontend — storefront** (`apps/client/src/features/catalog/`): public **Categories** page
(`/categories`) — pick a category, see its products; handles loading/empty/error. RTK Query slice
`catalogApi` registered in the store; nav link added.

**Frontend — admin** (`apps/admin/src/features/categories/`): category CRUD table with create /
inline edit / delete, validation and error surfacing. Added a Redux `Provider` + `adminApi` slice;
mutations `invalidatesTags: ['Category']` so lists refresh automatically.

**Checks:** requires `pnpm install` + a running Postgres (`docker compose up -d`, `pnpm db:migrate`,
`pnpm db:seed`) to run end-to-end; server unit tests run via `pnpm --filter @ecommerce/server test`.
