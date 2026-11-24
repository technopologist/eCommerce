import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatPrice, PROMOS } from '../utils/pricing';
import ProductImage from '../components/ProductImage';
import QuantityInput from '../components/QuantityInput';
import OrderSummary from '../components/OrderSummary';

export default function Cart() {
  const { items, totals, promoCode, setQty, remove, clear, applyPromo, removePromo } = useCart();
  const [code, setCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="empty">
        <p className="empty-emoji">🛒</p>
        <h2>Your cart is empty</h2>
        <p className="muted">Browse the shop and add something you like.</p>
        <Link to="/" className="btn btn-primary">Start shopping</Link>
      </div>
    );
  }

  const onApply = (e) => {
    e.preventDefault();
    if (applyPromo(code)) {
      setCode('');
      setPromoError('');
    } else {
      setPromoError('That code isn’t valid. Try SAVE10 or FREESHIP.');
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Shopping cart</h1>
        <button className="link-btn" onClick={clear}>Empty cart</button>
      </div>

      <div className="two-col">
        <ul className="line-items">
          {items.map((item) => (
            <li key={item.id} className="line-item">
              <Link to={`/product/${item.id}`}><ProductImage product={item} size="sm" /></Link>
              <div className="line-info">
                <Link to={`/product/${item.id}`} className="line-name">{item.name}</Link>
                <span className="muted small">{formatPrice(item.price)} each</span>
                {item.qty >= item.stock && <span className="stock low">Max available</span>}
              </div>
              <QuantityInput value={item.qty} onChange={(q) => setQty(item.id, q)} min={1} max={item.stock} />
              <div className="line-total">{formatPrice(item.price * item.qty)}</div>
              <button className="icon-btn" onClick={() => remove(item.id)} aria-label={`Remove ${item.name}`}>✕</button>
            </li>
          ))}
        </ul>

        <OrderSummary totals={totals} promoCode={promoCode}>
          {promoCode ? (
            <p className="promo-applied">
              ✓ <strong>{promoCode}</strong> – {PROMOS[promoCode].label}{' '}
              <button className="link-btn" onClick={removePromo}>remove</button>
            </p>
          ) : (
            <form className="promo" onSubmit={onApply}>
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Promo code" aria-label="Promo code" />
              <button className="btn" type="submit" disabled={!code.trim()}>Apply</button>
            </form>
          )}
          {promoError && <p className="error small">{promoError}</p>}
          <button className="btn btn-primary btn-block" onClick={() => navigate('/checkout')}>
            Proceed to checkout
          </button>
          <Link to="/" className="center small">Continue shopping</Link>
        </OrderSummary>
      </div>
    </>
  );
}
