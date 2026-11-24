import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../services/api';
import { formatPrice } from '../utils/pricing';
import OrderSummary from '../components/OrderSummary';
import Spinner from '../components/Spinner';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(undefined);

  useEffect(() => {
    getOrder(id).then(setOrder);
  }, [id]);

  if (order === undefined) return <Spinner />;
  if (order === null) {
    return (
      <div className="empty">
        <h2>Order not found</h2>
        <Link to="/orders" className="btn">View your orders</Link>
      </div>
    );
  }

  const { shipping } = order;
  return (
    <>
      <div className="confirm-banner">
        <span className="empty-emoji">🎉</span>
        <div>
          <h1>Thanks, {shipping.name.split(' ')[0]}! Your order is placed.</h1>
          <p className="muted">
            Order <strong>{order.id}</strong> · A confirmation would be sent to {shipping.email}.
          </p>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <h2>Items</h2>
          <ul className="mini-items">
            {order.items.map((i) => (
              <li key={i.id}>
                <span>{i.emoji} {i.name} × {i.qty}</span>
                <span>{formatPrice(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <h2>Shipping to</h2>
          <p>
            {shipping.name}<br />{shipping.address}<br />{shipping.city}, {shipping.zip}
          </p>
          <h2>Payment</h2>
          <p>Card ending in {order.payment.last4}</p>
        </div>
        <OrderSummary totals={order.totals} promoCode={order.promoCode}>
          <Link to="/" className="btn btn-primary btn-block">Continue shopping</Link>
          <Link to="/orders" className="center small">View all orders</Link>
        </OrderSummary>
      </div>
    </>
  );
}
