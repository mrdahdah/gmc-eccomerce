# @ecommerce/web — Next.js storefront + admin

A single Next.js (App Router, React 19) app that replaces the two Vite apps
(`apps/client` + `apps/admin`). It talks to the NestJS API over REST.

## Run

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # NEXT_PUBLIC_API_URL
pnpm --filter @ecommerce/web dev               # http://localhost:3001
```

Needs the API running (`pnpm --filter @ecommerce/server dev` on :3000) with a seeded DB.
`pnpm dev` from the repo root runs the API + this app together.

## What's inside

- **Storefront (guest-first):** home, `/products` (search + category filter + pagination),
  `/products/[slug]`, `/cart` (guest cart in `localStorage`), `/checkout` (email only — no
  signup required), `/login`, `/register`, `/account` (order history).
- **Admin (`/admin`, ADMIN role):** dashboard + CRUD for categories, products (with image
  URL/data-URI that the API normalises through Cloudinary), orders (status updates) and users.
  Admins sign in via the API's `/admin/auth/login`.
- **Toasts:** a dependency-free `ToastProvider` (`useToast`) used across the app.
- **Providers:** `AuthProvider` (JWT in `localStorage` + cookie), `CartProvider` (guest cart),
  `ToastProvider`.

## Config

`NEXT_PUBLIC_API_URL` — base URL of the API including `/api` (default `http://localhost:3000/api`).
