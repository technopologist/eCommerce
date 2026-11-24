import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function Header() {
  const { count } = useCart();
  const { ids } = useWishlist();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const navigate = useNavigate();

  // Keep the box in sync when the URL changes (e.g. "clear filters").
  useEffect(() => {
    setQuery(params.get('q') ?? '');
  }, [params]);

  const onSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (query.trim()) next.set('q', query.trim());
    else next.delete('q');
    navigate({ pathname: '/', search: next.toString() });
  };

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">🛍️ ShopEase</Link>

        <form className="search" onSubmit={onSubmit} role="search">
          <input
            type="search"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
          <button type="submit" aria-label="Search">🔍</button>
        </form>

        <nav className="nav">
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/wishlist" className="nav-icon">
            ♡ <span className="nav-label">Wishlist</span>
            {ids.length > 0 && <span className="badge">{ids.length}</span>}
          </NavLink>
          <NavLink to="/cart" className="nav-icon">
            🛒 <span className="nav-label">Cart</span>
            {count > 0 && <span className="badge">{count}</span>}
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
