export default function Rating({ value, count }) {
  const full = Math.round(value);
  return (
    <div className="rating" aria-label={`Rated ${value} out of 5`}>
      <span className="stars">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      <span className="muted small">{value.toFixed(1)}{count != null && ` (${count.toLocaleString()})`}</span>
    </div>
  );
}
