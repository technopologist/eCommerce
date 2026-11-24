import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatPrice } from '../utils/pricing';
import Rating from './Rating';
import ProductImage from './ProductImage';
import StockBadge from './StockBadge';

export default function ProductCard({ product }) {
  const { add, items } = useCart();
  const wishlist = useWishlist();
  const toast = useToast();
  const inCart = items.find((i) => i.id === product.id)?.qty ?? 0;
  const soldOut = product.stock === 0;
  const maxedOut = inCart >= product.stock;
  const saved = wishlist.has(product.id);

  const onAdd = () => {
    add(product, 1);
    toast(`Added "${product.name}" to cart`);
  };

  return (
    <article className="card">
      <button
        className={`heart ${saved ? 'on' : ''}`}
        onClick={() => wishlist.toggle(product.id)}
        aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'}
        aria-pressed={saved}
      >
        {saved ? '♥' : '♡'}
      </button>
      <Link to={`/product/${product.id}`} className="card-link">
        <ProductImage product={product} />
        <div className="card-body">
          <span className="muted small">{product.category}</span>
          <h3 className="card-title">{product.name}</h3>
          <Rating value={product.rating} count={product.reviews} />
        </div>
      </Link>
      <div className="card-footer">
        <div>
          <div className="price">{formatPrice(product.price)}</div>
          <StockBadge stock={product.stock} />
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAdd} disabled={soldOut || maxedOut}>
          {soldOut ? 'Sold out' : maxedOut ? 'Max in cart' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
