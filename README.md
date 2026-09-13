# Bloom

Bloom is a fictional specialty coffee roaster: a full-stack shop where you browse seasonal roasts, pick a bag size and grind, and check out.

**Live site:** https://bloomcoffee-shop.netlify.app

> Work in progress. Catalog, filters, cart, Stripe checkout (test mode), order records, stock tracking and an admin dashboard are live; product and order management are being built.

## Tech stack

- **Next.js 16** (App Router, Cache Components) with **TypeScript**
- **Tailwind CSS v4** and **shadcn/ui**
- **Cloud Firestore** via the Firebase Admin SDK, accessed only from server code
- **Zod** for validating data read from Firestore
- **Zustand** for the cart, persisted to localStorage
- **Vitest** for unit tests and **Playwright** for end-to-end tests against the Firestore emulator
- **GitHub Actions** CI on every pull request
- **Stripe Checkout** (test mode) with server-side re-pricing, and a signed webhook that records orders and decrements stock in a Firestore transaction
- **Firebase Auth** (Google sign-in) for the admin area, with server-verified session cookies and an email allowlist
- **Netlify** for hosting

## Getting started

Requires Node 24.

```bash
npm install
cp .env.example .env.local   # fill in Firebase and Stripe test keys
npm run db:seed              # load sample categories and coffees
npm run dev
```

To receive Stripe webhooks locally, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and put the printed `whsec_` secret in `.env.local` as `STRIPE_WEBHOOK_SECRET`.

## Scripts

| Command                     | Description                                                                     |
| --------------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`               | Start the dev server                                                            |
| `npm run build`             | Production build                                                                |
| `npm run lint`              | ESLint                                                                          |
| `npm run typecheck`         | Generate route types and run `tsc`                                              |
| `npm test`                  | Unit tests (Vitest)                                                             |
| `npm run e2e`               | Start the Firestore emulator, seed it, build and run Playwright (needs Java 21) |
| `npm run check:server-deps` | Load server SDKs with `require(esm)` disabled, as on Netlify functions          |
| `npm run format`            | Format with Prettier                                                            |
| `npm run db:seed`           | Seed Firestore with the sample catalog                                          |

## Deployment notes

### Why `jose` is pinned for `jwks-rsa`

`package.json` contains `"overrides": { "jwks-rsa": { "jose": "^5.10.0" } }`.

`firebase-admin/auth` depends on `jwks-rsa@4`, which calls `require("jose")`, and `jose@6` is ESM-only, so loading it needs Node's `require(esm)` support. Netlify functions run on AWS Lambda's `nodejs24.x` runtime (Node 24.19 at the time of writing), where `require(esm)` is **disabled by the runtime itself**, not through `NODE_OPTIONS`. Without the override, every function that imported Firebase Auth crashed on start. `jose@5` ships a CommonJS build and has the same API for the four functions `jwks-rsa` uses (`importJWK`, `exportSPKI`, `decodeJwt`, `decodeProtectedHeader`).

- `npm run check:server-deps` loads the server SDKs with `require(esm)` disabled and fails if this regresses.
- The admin dashboard's **Server runtime** section shows what the live functions support.
- **Remove the override** once that section reports `require(esm)` as supported, then run `npm install` and `npm run check:server-deps` to confirm.

Firebase Auth is also only imported by the admin session code (`src/lib/firebase/auth.ts`), so checkout, the Stripe webhook and the catalog never depend on it.

### Netlify environment variables

- Mark real secrets as secret: `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Don't mark public values as secret (`NEXT_PUBLIC_*`, `FIREBASE_PROJECT_ID`). They end up in the browser bundle, so Netlify's secret scan would fail the build.
- `SECRETS_SCAN_OMIT_PATHS` in `netlify.toml` skips Turbopack's build cache, which records env values but is never deployed.
