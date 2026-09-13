# Bloom

Bloom is a fictional specialty coffee roaster: a full-stack shop where you browse seasonal roasts, pick a bag size and grind, and check out.

**Live site:** https://bloomcoffee-shop.netlify.app

> Work in progress. Catalog, filters, cart, Stripe checkout (test mode), order records and stock tracking are live; an admin area is being built.

## Tech stack

- **Next.js 16** (App Router, Cache Components) with **TypeScript**
- **Tailwind CSS v4** and **shadcn/ui**
- **Cloud Firestore** via the Firebase Admin SDK, accessed only from server code
- **Zod** for validating data read from Firestore
- **Zustand** for the cart, persisted to localStorage
- **Vitest** for unit tests
- **Stripe Checkout** (test mode) with server-side re-pricing, and a signed webhook that records orders and decrements stock in a Firestore transaction
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

| Command             | Description                            |
| ------------------- | -------------------------------------- |
| `npm run dev`       | Start the dev server                   |
| `npm run build`     | Production build                       |
| `npm run lint`      | ESLint                                 |
| `npm run typecheck` | Generate route types and run `tsc`     |
| `npm test`          | Unit tests (Vitest)                    |
| `npm run format`    | Format with Prettier                   |
| `npm run db:seed`   | Seed Firestore with the sample catalog |
