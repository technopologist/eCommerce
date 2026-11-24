import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/api';
import { load, save } from '../services/storage';
import { formatPrice } from '../utils/pricing';
import OrderSummary from '../components/OrderSummary';

const EMPTY = { name: '', email: '', address: '', city: '', zip: '', card: '', expiry: '', cvc: '' };

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = 'Enter your full name.';
  if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.';
  if (!f.address.trim()) e.address = 'Enter your street address.';
  if (!f.city.trim()) e.city = 'Enter your city.';
  if (!/^[A-Za-z0-9 -]{3,10}$/.test(f.zip.trim())) e.zip = 'Enter a valid postal code.';
  if (!/^\d{16}$/.test(f.card.replace(/\s/g, ''))) e.card = 'Card number must be 16 digits.';
  const m = f.expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!m || +m[1] < 1 || +m[1] > 12) e.expiry = 'Use MM/YY.';
  else {
    const now = new Date();
    const exp = new Date(2000 + +m[2], +m[1]); // first day of month after expiry
    if (exp <= now) e.expiry = 'Card has expired.';
  }
  if (!/^\d{3,4}$/.test(f.cvc)) e.cvc = '3–4 digits.';
  return e;
}

const formatCard = (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function Checkout() {
  const { items, totals, promoCode, clear } = useCart();
  const navigate = useNavigate();
  const placed = useRef(false);
  // Prefill shipping details from the last order for convenience.
  const [form, setForm] = useState(() => ({ ...EMPTY, ...load('lastShipping', {}) }));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (items.length === 0 && !placed.current) return <Navigate to="/cart" replace />;

  const set = (key, transform) => (e) => {
    const value = transform ? transform(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    setServerError('');
    try {
      const shipping = {
        name: form.name.trim(), email: form.email.trim(),
        address: form.address.trim(), city: form.city.trim(), zip: form.zip.trim(),
      };
      const order = await createOrder({
        items: items.map(({ id, name, price, qty, emoji, color }) => ({ id, name, price, qty, emoji, color })),
        shipping,
        payment: { last4: form.card.replace(/\s/g, '').slice(-4) },
        totals,
        promoCode,
      });
      save('lastShipping', shipping);
      placed.current = true;
      navigate(`/order/${order.id}`, { replace: true });
      clear();
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const field = (key, label, props = {}) => (
    <label className={`field ${errors[key] ? 'has-error' : ''}`}>
      <span>{label}</span>
      <input value={form[key]} onChange={set(key, props.transform)} {...props.input} aria-invalid={!!errors[key]} />
      {errors[key] && <small className="error">{errors[key]}</small>}
    </label>
  );

  return (
    <>
      <h1>Checkout</h1>
      <div className="two-col">
        <form className="checkout-form" onSubmit={onSubmit} noValidate>
          <fieldset disabled={submitting}>
            <legend>Shipping details</legend>
            {field('name', 'Full name', { input: { autoComplete: 'name' } })}
            {field('email', 'Email', { input: { type: 'email', autoComplete: 'email' } })}
            {field('address', 'Street address', { input: { autoComplete: 'street-address' } })}
            <div className="row">
              {field('city', 'City', { input: { autoComplete: 'address-level2' } })}
              {field('zip', 'Postal code', { input: { autoComplete: 'postal-code' } })}
            </div>
          </fieldset>

          <fieldset disabled={submitting}>
            <legend>Payment</legend>
            <p className="notice small">🧪 Demo only — no real payment is processed. Use any 16 digits, e.g. 4242 4242 4242 4242.</p>
            {field('card', 'Card number', { transform: formatCard, input: { inputMode: 'numeric', placeholder: '1234 5678 9012 3456' } })}
            <div className="row">
              {field('expiry', 'Expiry', { transform: formatExpiry, input: { inputMode: 'numeric', placeholder: 'MM/YY' } })}
              {field('cvc', 'CVC', { transform: (v) => v.replace(/\D/g, '').slice(0, 4), input: { inputMode: 'numeric', placeholder: '123' } })}
            </div>
          </fieldset>

          {serverError && <p className="error banner">{serverError} <Link to="/cart">Review cart</Link></p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Placing order…' : `Place order · ${formatPrice(totals.total)}`}
          </button>
        </form>

        <OrderSummary totals={totals} promoCode={promoCode}>
          <ul className="mini-items">
            {items.map((i) => (
              <li key={i.id}>
                <span>{i.emoji} {i.name} × {i.qty}</span>
                <span>{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <Link to="/cart" className="center small">Edit cart</Link>
        </OrderSummary>
      </div>
    </>
  );
}
