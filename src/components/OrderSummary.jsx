import { formatPrice, FREE_SHIPPING_THRESHOLD } from '../utils/pricing';

export default function OrderSummary({ totals, promoCode, children }) {
  const { subtotal, discount, shipping, tax, total } = totals;
  const remaining = FREE_SHIPPING_THRESHOLD - (subtotal - discount);
  return (
    <aside className="summary">
      <h2>Order summary</h2>
      <dl>
        <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
        {discount > 0 && (
          <div className="discount"><dt>Discount ({promoCode})</dt><dd>−{formatPrice(discount)}</dd></div>
        )}
        <div><dt>Shipping</dt><dd>{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd></div>
        <div><dt>Estimated tax</dt><dd>{formatPrice(tax)}</dd></div>
        <div className="total"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
      </dl>
      {shipping > 0 && remaining > 0 && (
        <p className="hint">Add {formatPrice(remaining)} more for free shipping.</p>
      )}
      {children}
    </aside>
  );
}
