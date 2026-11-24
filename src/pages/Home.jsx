import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCategories, getProducts } from '../services/api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name A–Z' },
];

const PRICE_CAPS = [
  { value: '', label: 'Any price' },
  { value: '25', label: 'Under $25' },
  { value: '50', label: 'Under $50' },
  { value: '100', label: 'Under $100' },
];

export default function Home() {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const sort = params.get('sort') ?? 'featured';
  const maxPrice = params.get('max') ?? '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState(null);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setProducts(null);
    getProducts({ search, category, sort, maxPrice: maxPrice ? Number(maxPrice) : undefined }).then((list) => {
      if (!cancelled) setProducts(list);
    });
    return () => {
      cancelled = true;
    };
  }, [search, category, sort, maxPrice]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const hasFilters = search || category || maxPrice || sort !== 'featured';

  return (
    <>
      {!hasFilters && (
        <section className="hero">
          <div>
            <h1>Everyday essentials, delivered.</h1>
            <p>Free shipping on orders over $50. Use code <strong>SAVE10</strong> for 10% off.</p>
          </div>
          <span className="hero-emoji" aria-hidden="true">📦</span>
        </section>
      )}

      <div className="toolbar">
        <div className="chips" role="group" aria-label="Categories">
          <button className={`chip ${!category ? 'active' : ''}`} onClick={() => update('category', '')}>All</button>
          {categories.map((c) => (
            <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => update('category', c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="selects">
          <select value={maxPrice} onChange={(e) => update('max', e.target.value)} aria-label="Price range">
            {PRICE_CAPS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select value={sort} onChange={(e) => update('sort', e.target.value === 'featured' ? '' : e.target.value)} aria-label="Sort by">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {search && (
        <p className="muted">
          Results for “{search}” ·{' '}
          <button className="link-btn" onClick={() => update('q', '')}>clear search</button>
        </p>
      )}

      {products === null ? (
        <Spinner />
      ) : products.length === 0 ? (
        <div className="empty">
          <p className="empty-emoji">🔎</p>
          <h2>No products found</h2>
          <p className="muted">Try a different search or remove some filters.</p>
          <button className="btn" onClick={() => setParams({})}>Clear all filters</button>
        </div>
      ) : (
        <>
          <p className="muted small">{products.length} product{products.length === 1 ? '' : 's'}</p>
          <div className="grid">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </>
      )}
    </>
  );
}
