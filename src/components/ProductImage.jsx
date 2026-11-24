// Placeholder imagery: emoji on a tinted tile. Replace with <img src={product.imageUrl}>
// once real product photos come from the backend.
export default function ProductImage({ product, size = 'md' }) {
  return (
    <div className={`product-image ${size}`} style={{ background: product.color }} aria-hidden="true">
      <span>{product.emoji}</span>
    </div>
  );
}
