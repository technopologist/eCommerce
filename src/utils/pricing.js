export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_FEE = 5.99;
export const TAX_RATE = 0.08;

export const PROMOS = {
  SAVE10: { type: 'percent', value: 10, label: '10% off your order' },
  FREESHIP: { type: 'shipping', label: 'Free shipping' },
};

const round = (n) => Math.round(n * 100) / 100;

export function calcTotals(items, promoCode) {
  const subtotal = round(items.reduce((s, i) => s + i.price * i.qty, 0));
  const promo = PROMOS[promoCode];
  const discount = promo?.type === 'percent' ? round((subtotal * promo.value) / 100) : 0;
  const afterDiscount = subtotal - discount;
  const shipping =
    items.length === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD || promo?.type === 'shipping'
      ? 0
      : SHIPPING_FEE;
  const tax = round(afterDiscount * TAX_RATE);
  const total = round(afterDiscount + shipping + tax);
  return { subtotal, discount, shipping, tax, total };
}

const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const formatPrice = (n) => fmt.format(n);
