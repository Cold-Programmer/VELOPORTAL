import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';

const PRODUCT_TYPES = [
  { value: '', label: '🌐 All products' },
  { value: 'bicycle', label: '🚲 Bicycles' },
  { value: 'accessory', label: '🛡️ Accessories' },
  { value: 'equipment', label: '🔧 Equipment' },
];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name A–Z' },
];

export default function Shop() {
  const [items,      setItems]      = useState([]);
  const [categories, setCategories] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [params, setParams]         = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get('q') || '');

  const q           = params.get('q') || '';
  const category    = params.get('category') || '';
  const sort        = params.get('sort') || 'newest';
  const productType = params.get('productType') || '';
  const page        = Number(params.get('page') || 1);

  useEffect(() => {
    api.get('/products/categories').then(r => setCategories(r.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/products', { params: { q, category, sort, productType, page, limit: 12 } })
      .then(r => { setItems(r.data.items); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [q, category, sort, productType, page]);

  const set = (key, val) => {
    const next = new URLSearchParams(params);
    val ? next.set(key, val) : next.delete(key);
    // Only jump back to page 1 when a filter changes — not when the click
    // itself IS a page-number click (that was overwriting page 2+ back to 1).
    if (key !== 'page') next.set('page', '1');
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-ink-100 bg-white dark:bg-forest-dark dark:border-white/10">
        <div className="section-sm">
          <Reveal>
            <p className="eyebrow">Shop</p>
            <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Bicycles, accessories & equipment</h1>
            <p className="mt-2 text-sm text-ink-400 dark:text-white/50">{total} products available</p>
          </Reveal>

          {/* Product type tabs */}
          <div className="mt-6 flex flex-wrap gap-2">
            {PRODUCT_TYPES.map(t => (
              <button key={t.value} onClick={() => set('productType', t.value)}
                className={`btn-tab !px-4 !py-2 text-sm ${productType === t.value ? 'bg-forest text-white' : 'bg-sand-100 text-ink-400 hover:bg-forest/8 hover:text-forest dark:bg-white/10 dark:text-white/60 dark:hover:bg-white/20'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        {/* Filters bar */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <form onSubmit={e => { e.preventDefault(); set('q', searchInput); }}
            className="flex gap-2 sm:w-80">
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search products…" className="input" />
            <button type="submit" className="btn-primary !px-4">🔍</button>
          </form>

          <div className="flex flex-wrap gap-2">
            <select className="input !w-auto" value={category} onChange={e => set('category', e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
            <select className="input !w-auto" value={sort} onChange={e => set('sort', e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse aspect-[4/5] rounded-2xl bg-ink-100 dark:bg-white/5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-4 text-lg font-semibold">No products match your filters</p>
            <p className="mt-1 text-sm text-ink-400">Try a different category or clear the search.</p>
            <button onClick={() => { setParams({}); setSearchInput(''); }} className="btn-secondary mt-6">Clear all filters</button>
          </div>
        ) : (
          <div className="grid gap-5 stagger sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map(b => <ProductCard key={b.id} bike={b} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button key={i} onClick={() => set('page', String(i + 1))}
                className={`h-10 w-10 rounded-full text-sm font-semibold transition-all ${page === i+1 ? 'bg-forest text-white shadow-forest' : 'bg-white text-ink-400 hover:bg-forest/8 hover:text-forest dark:bg-white/10 dark:text-white/60'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
