export default function StockBadge({ stock }) {
  if (stock === 0) return <span className="stock out">Out of stock</span>;
  if (stock <= 5) return <span className="stock low">Only {stock} left</span>;
  return <span className="stock in">In stock</span>;
}
