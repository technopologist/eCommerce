import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { pool, withTransaction, PRODUCT_COLUMNS } from './db.js';
import { calcTotals, PROMOS } from '../src/utils/pricing.js';

export const api = Router();

// Thrown for problems the shopper can fix; message is shown in the UI.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Wraps async handlers so rejected promises reach the error middleware.
const route = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);

// Used by Render's health check: confirms the process can reach the DB.
api.get('/health', route(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
}));

// TEMPORARY: verify client-IP detection behind Render's proxies.
api.get('/_ipcheck', (req, res) => res.json({ ip: req.ip, ips: req.ips, xff: req.get('x-forwarded-for') ?? null }));

// Generous for a real shopper, tight enough to stop scripted order spam
// and stock-draining. Keyed by client IP (see `trust proxy` in index.js).
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many orders from this address. Please try again later.' },
});
const readLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' } });
api.use(readLimiter);

// There is no login yet: each browser gets an anonymous id (see
// src/services/api.js) and orders are scoped to it.
function customerId(req) {
  const id = req.get('x-customer-id') ?? '';
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(id)) throw new HttpError(400, 'Missing or invalid customer id.');
  return id;
}

const SORTS = {
  featured: 'id',
  'price-asc': 'price ASC, id',
  'price-desc': 'price DESC, id',
  rating: 'rating DESC, id',
  name: 'name ASC',
};

api.get('/categories', route(async (_req, res) => {
  const { rows } = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
  res.json(rows.map((r) => r.category));
}));

api.get('/products', route(async (req, res) => {
  const { search = '', category = '', sort = 'featured', maxPrice, ids } = req.query;
  const where = [];
  const params = [];
  const add = (sql, value) => {
    params.push(value);
    where.push(sql.replace('?', `$${params.length}`));
  };

  if (ids !== undefined) add('id = ANY(?)', String(ids).split(',').filter(Boolean));
  if (category) add('category = ?', String(category));
  if (maxPrice && Number(maxPrice) > 0) add('price <= ?', Number(maxPrice));
  const q = String(search).trim();
  if (q) add("(name || ' ' || category || ' ' || description) ILIKE ?", `%${q.replace(/[\\%_]/g, '\\$&')}%`);

  const { rows } = await pool.query(
    `SELECT ${PRODUCT_COLUMNS} FROM products
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY ${SORTS[sort] ?? SORTS.featured}`,
    params
  );
  res.json(rows);
}));

api.get('/products/:id', route(async (req, res) => {
  const { rows } = await pool.query(`SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = $1`, [req.params.id]);
  if (!rows[0]) throw new HttpError(404, 'Product not found.');
  res.json(rows[0]);
}));

// Orders with their lines from order_items, returned in the shape the
// client uses: items: [{ id, name, price, qty, emoji, color }].
// emoji/color are display-only, so they come from the live product row.
const ORDER_SELECT = `
  SELECT o.id, o.created_at AS "createdAt", o.status, o.shipping, o.payment, o.totals,
         o.promo_code AS "promoCode",
         COALESCE((
           SELECT json_agg(json_build_object(
                    'id', i.product_id, 'name', i.name, 'price', i.unit_price::float8,
                    'qty', i.qty, 'emoji', p.emoji, 'color', p.color) ORDER BY i.line_no)
           FROM order_items i JOIN products p ON p.id = i.product_id
           WHERE i.order_id = o.id
         ), '[]') AS items
  FROM orders o`;

api.get('/orders', route(async (req, res) => {
  const { rows } = await pool.query(
    `${ORDER_SELECT} WHERE o.customer_id = $1 ORDER BY o.created_at DESC`,
    [customerId(req)]
  );
  res.json(rows);
}));

api.get('/orders/:id', route(async (req, res) => {
  const { rows } = await pool.query(
    `${ORDER_SELECT} WHERE o.id = $1 AND o.customer_id = $2`,
    [req.params.id, customerId(req)]
  );
  if (!rows[0]) throw new HttpError(404, 'Order not found.');
  res.json(rows[0]);
}));

function parseOrderInput(body) {
  const { items, shipping, payment, promoCode } = body ?? {};
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Your cart is empty.');
  if (items.length > 100) throw new HttpError(400, 'Too many items in one order.');

  // Merge duplicate lines and validate quantities.
  const qtyById = new Map();
  for (const item of items) {
    const qty = Number(item?.qty);
    if (typeof item?.id !== 'string' || !Number.isInteger(qty) || qty < 1 || qty > 999) {
      throw new HttpError(400, 'Invalid cart item.');
    }
    qtyById.set(item.id, (qtyById.get(item.id) ?? 0) + qty);
  }

  const str = (v, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const ship = {
    name: str(shipping?.name), email: str(shipping?.email), address: str(shipping?.address),
    city: str(shipping?.city), zip: str(shipping?.zip, 20),
  };
  if (Object.values(ship).some((v) => !v) || !/^\S+@\S+\.\S+$/.test(ship.email)) {
    throw new HttpError(400, 'Please complete your shipping details.');
  }

  // Only the last four digits are ever accepted or stored.
  const last4 = String(payment?.last4 ?? '');
  if (!/^\d{4}$/.test(last4)) throw new HttpError(400, 'Invalid payment details.');

  const promo = typeof promoCode === 'string' && PROMOS[promoCode] ? promoCode : null;
  return { qtyById, shipping: ship, payment: { last4 }, promoCode: promo };
}

api.post('/orders', orderLimiter, route(async (req, res) => {
  const customer = customerId(req);
  const input = parseOrderInput(req.body);

  const order = await withTransaction(async (db) => {
    // Lock the rows so concurrent orders can't oversell.
    const { rows: products } = await db.query(
      `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ANY($1) ORDER BY id FOR UPDATE`,
      [[...input.qtyById.keys()]]
    );
    const byId = new Map(products.map((p) => [p.id, p]));

    const items = [];
    for (const [id, qty] of input.qtyById) {
      const p = byId.get(id);
      if (!p) throw new HttpError(409, 'A product in your cart is no longer available.');
      if (qty > p.stock) {
        throw new HttpError(409, p.stock === 0
          ? `"${p.name}" is now out of stock.`
          : `Only ${p.stock} of "${p.name}" left in stock.`);
      }
      // Prices come from the database, never from the client.
      items.push({ id, name: p.name, price: p.price, qty, emoji: p.emoji, color: p.color });
    }

    await db.query(
      `UPDATE products p SET stock = p.stock - o.qty
       FROM jsonb_to_recordset($1::jsonb) AS o(id text, qty int) WHERE p.id = o.id`,
      [JSON.stringify(items.map(({ id, qty }) => ({ id, qty })))]
    );

    const id = 'ORD-' + randomBytes(5).toString('hex').toUpperCase();
    await db.query(
      `INSERT INTO orders (id, customer_id, shipping, payment, totals, promo_code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, customer, input.shipping, input.payment, calcTotals(items, input.promoCode), input.promoCode]
    );
    await db.query(
      `INSERT INTO order_items (order_id, line_no, product_id, name, unit_price, qty)
       SELECT $1, l.line_no, l.id, l.name, l.price, l.qty
       FROM jsonb_to_recordset($2::jsonb) AS l(line_no int, id text, name text, price numeric, qty int)`,
      [id, JSON.stringify(items.map((it, i) => ({ ...it, line_no: i + 1 })))]
    );
    const { rows } = await db.query(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
    return rows[0];
  });

  res.status(201).json(order);
}));

api.use((_req, _res, next) => next(new HttpError(404, 'Not found.')));

// eslint-disable-next-line no-unused-vars
api.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});
