import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProduct, getProducts } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/pricing';
import ProductImage from '../components/ProductImage';
import ProductCard from '../components/ProductCard';
import QuantityInput from '../components/QuantityInput';
import Rating from '../components/Rating';
import StockBadge from '../components/StockBadge';
import Spinner from '../components/Spinner';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { add, items } = useCart();
  const wishlist = useWishlist();
  const toast = useToast();

  const [product, setProduct] = useState(undefined); // undefined = loading, null = not found
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setProduct(undefined);
    setQty(1);
    getProduct(id).then(async (p) => {
      if (cancelled) return;
      setProduct(p);
      if (p) {
        const same = await getProducts({ category: p.category });
        if (!cancelled) setRelated(same.filter((x) => x.id !== p.id).slice(0, 4));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (product === undefined) return <Spinner />;
  if (product === null) {
    return (
      <div className="empty">
        <h2>Product not found</h2>
        <Link to="/" className="btn">Back to shop</Link>
      </div>
    );
  }

  const inCart = items.find((i) => i.id === product.id)?.qty ?? 0;
  const available = Math.max(0, product.stock - inCart);
  const saved = wishlist.has(product.id);

  const onAdd = (goToCart = false) => {
    add(product, qty);
    toast(`Added ${qty} × "${product.name}" to cart`);
    setQty(1);
    if (goToCart) navigate('/cart');
  };

  return (
    <>
      <nav className="breadcrumbs muted small">
        <Link to="/">Shop</Link> / <Link to={`/?category=${encodeURIComponent(product.category)}`}>{product.category}</Link> / {product.name}
      </nav>

      <section className="detail">
        <ProductImage product={product} size="lg" />
        <div className="detail-info">
          <h1>{product.name}</h1>
          <Rating value={product.rating} count={product.reviews} />
          <p className="price lg">{formatPrice(product.price)}</p>
          <StockBadge stock={product.stock} />
          <p>{product.description}</p>
          <ul className="features">
            {product.features.map((f) => <li key={f}>{f}</li>)}
          </ul>

          {inCart > 0 && <p className="muted small">You have {inCart} in your cart.</p>}

          <div className="buy-row">
            {available > 0 && <QuantityInput value={qty} onChange={setQty} min={1} max={available} />}
            <button className="btn btn-primary" onClick={() => onAdd(false)} disabled={available === 0}>
              {product.stock === 0 ? 'Sold out' : available === 0 ? 'Max in cart' : 'Add to cart'}
            </button>
            {available > 0 && (
              <button className="btn" onClick={() => onAdd(true)}>Buy now</button>
            )}
            <button
              className={`btn btn-ghost ${saved ? 'saved' : ''}`}
              onClick={() => wishlist.toggle(product.id)}
              aria-pressed={saved}
            >
              {saved ? '♥ Saved' : '♡ Save'}
            </button>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <h2>You may also like</h2>
          <div className="grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </>
  );
}
