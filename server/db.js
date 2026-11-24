// Neon serverless Postgres. The Pool speaks the Postgres protocol over
// WebSockets, which supports interactive transactions (needed to check
// and decrement stock atomically when an order is placed).
import { Pool } from '@neondatabase/serverless';
import { products as seedProducts } from './seed-products.js';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add your Neon connection string to .env (see .env.example).');
  process.exit(1);
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Runs every column through a JS-friendly type (numeric -> float8).
export const PRODUCT_COLUMNS = `
  id, name, category, price::float8 AS price, rating::float8 AS rating, reviews,
  stock, emoji, color, description, features`;

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Idempotent: creates tables if missing and seeds the catalog once.
export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id            text PRIMARY KEY,
      name          text NOT NULL,
      category      text NOT NULL,
      price         numeric(10,2) NOT NULL CHECK (price >= 0),
      rating        numeric(2,1) NOT NULL DEFAULT 0,
      reviews       integer NOT NULL DEFAULT 0,
      stock         integer NOT NULL CHECK (stock >= 0),
      initial_stock integer NOT NULL,
      emoji         text,
      color         text,
      description   text NOT NULL DEFAULT '',
      features      jsonb NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS orders (
      id          text PRIMARY KEY,
      customer_id text NOT NULL,
      created_at  timestamptz NOT NULL DEFAULT now(),
      status      text NOT NULL DEFAULT 'Processing',
      shipping    jsonb NOT NULL,
      payment     jsonb NOT NULL,
      totals      jsonb NOT NULL,
      promo_code  text
    );
    CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders (customer_id, created_at DESC);

    -- One row per product per order. name and unit_price are snapshots
    -- taken at purchase time, so later catalog edits don't rewrite history.
    CREATE TABLE IF NOT EXISTS order_items (
      order_id   text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      line_no    integer NOT NULL,
      product_id text NOT NULL REFERENCES products(id),
      name       text NOT NULL,
      unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
      qty        integer NOT NULL CHECK (qty > 0),
      PRIMARY KEY (order_id, line_no),
      UNIQUE (order_id, product_id)
    );
    CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items (product_id);
  `);

  // Earlier versions stored lines in orders.items (jsonb). Move them into
  // order_items and drop the column. Runs once; a no-op afterwards.
  const { rows: legacy } = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = 'orders' AND column_name = 'items'`
  );
  if (legacy.length) {
    await withTransaction(async (db) => {
      const { rowCount } = await db.query(`
        INSERT INTO order_items (order_id, line_no, product_id, name, unit_price, qty)
        SELECT o.id, i.ord::int, i.item->>'id', i.item->>'name',
               (i.item->>'price')::numeric, (i.item->>'qty')::int
        FROM orders o, jsonb_array_elements(o.items) WITH ORDINALITY AS i(item, ord)
        ON CONFLICT DO NOTHING`);
      await db.query('ALTER TABLE orders DROP COLUMN items');
      console.log(`Migrated ${rowCount} order lines into order_items.`);
    });
  }

  const { rows } = await pool.query('SELECT count(*)::int AS n FROM products');
  if (rows[0].n === 0) {
    await pool.query(
      `INSERT INTO products (id, name, category, price, rating, reviews, stock, initial_stock,
                             emoji, color, description, features)
       SELECT * FROM jsonb_to_recordset($1::jsonb) AS p(
         id text, name text, category text, price numeric, rating numeric, reviews int,
         stock int, initial_stock int, emoji text, color text, description text, features jsonb)`,
      [JSON.stringify(seedProducts.map((p) => ({ ...p, initial_stock: p.stock })))]
    );
    console.log(`Seeded ${seedProducts.length} products.`);
  }
}
