// Client for the Express API in server/api.js. Function names and return
// shapes match the old mock layer, so pages didn't need to change.
import { load, save } from './storage';

// Anonymous per-browser id; orders are scoped to it until auth is added.
function customerId() {
  let id = load('customerId', null);
  if (!id) {
    id = crypto.randomUUID();
    save('customerId', id);
  }
  return id;
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'X-Customer-Id': customerId(),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Returns null instead of throwing for a 404, like the old mock did.
const orNull = (p) => p.catch((err) => (err.status === 404 ? null : Promise.reject(err)));

export const getCategories = () => request('/categories');

export function getProducts({ search = '', category = '', sort = 'featured', maxPrice } = {}) {
  const qs = new URLSearchParams({ search, category, sort });
  if (maxPrice) qs.set('maxPrice', maxPrice);
  return request('/products?' + qs);
}

export const getProduct = (id) => orNull(request('/products/' + encodeURIComponent(id)));

export function getProductsByIds(ids) {
  if (!ids.length) return Promise.resolve([]);
  return request('/products?ids=' + ids.map(encodeURIComponent).join(','));
}

// The server recomputes prices, totals and stock; only ids, quantities,
// shipping, last4 and the promo code are sent.
export const createOrder = ({ items, shipping, payment, promoCode }) =>
  request('/orders', {
    method: 'POST',
    body: { items: items.map(({ id, qty }) => ({ id, qty })), shipping, payment, promoCode },
  });

export const getOrders = () => request('/orders');

export const getOrder = (id) => orNull(request('/orders/' + encodeURIComponent(id)));
