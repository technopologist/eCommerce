# ShopEase

A simple eCommerce store: **React + Vite** front end and a **Node.js + Express** API backed by **Neon serverless Postgres**, served from a single Node process.

## Run it

1. Create a Neon project and copy its **pooled** connection string.
2. `cp .env.example .env` and paste it into `DATABASE_URL`.
3. Then:

```bash
npm install
npm run dev      # http://localhost:5173 (API + app, hot reload)
```

Tables are created and the catalog is seeded automatically on first start.

## Deploy (Render)

The repo includes a Render Blueprint (`render.yaml`): one Node web service in the Ohio region, next to the Neon database.

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, select the repo, and enter `DATABASE_URL` when prompted.
3. Render runs `npm ci && npm run build`, then `npm start`, and checks `/api/health`.

Every push to `main` redeploys automatically. HTTPS and custom domains are handled by Render.

To run production mode locally: `npm run build && npm start`. Requires Node 22+.

## What you can test

- **Browse** 18 mock products, filter by category and price, sort, and search (search terms live in the URL, so results are shareable).
- **Product page** with quantity picker, stock levels, "Buy now", and related products.
- **Cart** — change quantities (capped at stock), remove items, apply promo codes `SAVE10` (10% off) or `FREESHIP`. Free shipping over $50; 8% tax.
- **Checkout** — validated shipping and payment form. Payment is fake: use any 16 digits such as `4242 4242 4242 4242`, a future expiry like `12/30`, and any 3-digit CVC.
- **Orders** — confirmation page and order history. Placing an order reduces stock, so you can buy an item until it sells out.
- **Wishlist** — tap the heart on any product.

## Structure

```
server/
  index.js           Express entry: /api + the app (Vite middleware in dev, dist/ in prod)
  api.js             REST routes
  db.js              Neon pool, schema migration, seeding
  seed-products.js   initial catalog
src/
  services/api.js    fetch client for /api
  services/storage.js  namespaced localStorage helpers (cart, wishlist, customer id)
  context/           Cart, Wishlist and Toast state (React context)
  utils/pricing.js   totals, shipping, tax, promo codes (shared with the server)
  components/        reusable UI
  pages/             routes
```

## Database

| Table | Holds |
|---|---|
| `products` | catalog and current `stock` (`initial_stock` is the seeded level) |
| `orders` | one row per order: customer id, status, shipping, payment (last 4 digits only), totals, promo code |
| `order_items` | one row per product per order: `order_id` → `orders`, `product_id` → `products`, and `name`/`unit_price`/`qty` copied at purchase time |

The schema is created and migrated on startup by `server/db.js`.

## API

| Method | Path | Notes |
|---|---|---|
| GET | `/api/categories` | |
| GET | `/api/products` | `search`, `category`, `sort`, `maxPrice`, `ids=a,b` |
| GET | `/api/products/:id` | |
| GET | `/api/orders` | orders for the calling browser |
| GET | `/api/orders/:id` | |
| POST | `/api/orders` | `{ items:[{id,qty}], shipping, payment:{last4}, promoCode }` |
| GET | `/api/health` | health check (pings the database) |

In production the server also sends security headers (helmet: CSP, HSTS, etc.) and rate-limits requests: 20 orders per 15 minutes and 300 requests per minute per IP.

The server prices orders from the database and checks and decrements stock in a row-locked transaction, so client-side totals aren’t trusted.

There is no login yet. Each browser gets an anonymous id (sent as `X-Customer-Id`), and orders are scoped to it. The cart and wishlist stay in `localStorage`.
