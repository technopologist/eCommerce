import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../services/api';
import { formatPrice } from '../utils/pricing';
import Spinner from '../components/Spinner';

export default function Orders() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    getOrders().then(setOrders);
  }, []);

  if (orders === null) return <Spinner />;
  if (orders.length === 0) {
    return (
      <div className="empty">
        <p className="empty-emoji">📦</p>
        <h2>No orders yet</h2>
        <p className="muted">When you place an order it will show up here.</p>
        <Link to="/" className="btn btn-primary">Start shopping</Link>
      </div>
    );
  }

  return (
    <>
      <h1>Your orders</h1>
      <ul className="orders">
        {orders.map((o) => {
          const count = o.items.reduce((s, i) => s + i.qty, 0);
          return (
            <li key={o.id}>
              <Link to={`/order/${o.id}`} className="order-row">
                <div className="order-emojis" aria-hidden="true">
                  {o.items.slice(0, 4).map((i) => <span key={i.id}>{i.emoji}</span>)}
                </div>
                <div className="order-meta">
                  <strong>{o.id}</strong>
                  <span className="muted small">
                    {new Date(o.createdAt).toLocaleString()} · {count} item{count === 1 ? '' : 's'}
                  </span>
                </div>
                <span className="status">{o.status}</span>
                <strong>{formatPrice(o.totals.total)}</strong>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
