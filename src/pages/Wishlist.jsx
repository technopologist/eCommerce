import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { getProductsByIds } from '../services/api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

export default function Wishlist() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getProductsByIds(ids).then((list) => {
      if (!cancelled) setProducts(list);
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (products === null) return <Spinner />;

  // Filter locally so un-hearting an item removes it instantly.
  const visible = products.filter((p) => ids.includes(p.id));

  if (visible.length === 0) {
    return (
      <div className="empty">
        <p className="empty-emoji">♡</p>
        <h2>Your wishlist is empty</h2>
        <p className="muted">Tap the heart on any product to save it for later.</p>
        <Link to="/" className="btn btn-primary">Browse products</Link>
      </div>
    );
  }

  return (
    <>
      <h1>Wishlist</h1>
      <div className="grid">
        {visible.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </>
  );
}
