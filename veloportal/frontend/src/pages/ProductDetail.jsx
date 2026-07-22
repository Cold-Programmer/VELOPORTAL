import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Reveal from '../components/Reveal';

export default function ProductDetail() {
  const { slug } = useParams();
  const [bike, setBike]     = useState(null);
  const [qty, setQty]       = useState(1);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [wishlisted, setWishlisted] = useState(false);
  const [cartMsg, setCartMsg]       = useState('');
  const [loading, setLoading]       = useState(true);
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const load = () => api.get(`/products/${slug}`).then(r => setBike(r.data.item)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [slug]);

  if (loading) return (
    <div className="section grid gap-10 lg:grid-cols-2">
      <div className="aspect-[4/3] rounded-3xl bg-ink-100 animate-pulse dark:bg-white/5" />
      <div className="space-y-4">
        {[140, 80, 60, 100].map((w, i) => (
          <div key={i} className={`h-5 rounded bg-ink-100 animate-pulse dark:bg-white/5`} style={{ width: `${w}%` || '100%', maxWidth: `${w}%` }} />
        ))}
      </div>
    </div>
  );
  if (!bike) return <div className="section text-center text-ink-400">Product not found.</div>;

  const handleAddToCart = async () => {
    if (!user) return navigate('/login');
    await addToCart(bike.id, qty);
    setCartMsg('✅ Added to cart!');
    setTimeout(() => setCartMsg(''), 2500);
  };

  const toggleWishlist = async () => {
    if (!user) return navigate('/login');
    const { data } = await api.post(`/products/${bike.slug}/wishlist`);
    setWishlisted(data.wishlisted);
  };

  const submitReview = async e => {
    e.preventDefault();
    if (!user) return navigate('/login');
    await api.post(`/products/${slug}/reviews`, review);
    setReview({ rating: 5, comment: '' });
    load();
  };

  const isOutOfStock = bike.stock === 0;
  const isLowStock   = bike.stock > 0 && bike.stock <= 5;

  return (
    <div className="section">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Image */}
        <Reveal direction="left">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-sand-100 dark:bg-forest-dark/50">
            <img src={bike.images?.[0]} alt={bike.name} className="h-full w-full object-cover" />
            {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center bg-black/50"><span className="badge badge-danger text-sm px-4 py-2">Out of stock</span></div>}
          </div>
        </Reveal>

        {/* Info */}
        <Reveal direction="right">
          <p className="eyebrow">{bike.Category?.name}</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{bike.name}</h1>
          <p className="mt-1 text-sm text-ink-400 dark:text-white/50">{bike.brand}{bike.frameSize ? ` · Frame ${bike.frameSize}` : ''}{bike.wheelSize ? ` · Wheel ${bike.wheelSize}` : ''}</p>

          {bike.ratingCount > 0 && (
            <div className="mt-3"><StarRating value={Number(bike.ratingAvg)} count={bike.ratingCount} /></div>
          )}

          <p className="mt-5 font-display text-4xl font-bold text-forest dark:text-amber">
            KES {Number(bike.price).toLocaleString()}
          </p>

          {bike.forRent && (
            <p className="mt-1 text-sm text-ink-400">Also rentable from KES {Number(bike.rentalPricePerHour).toLocaleString()}/hr</p>
          )}

          <p className="mt-5 leading-relaxed text-ink-500 dark:text-white/65">{bike.description}</p>

          {/* Stock status */}
          <div className="mt-4 flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-dark' : 'bg-green-500'}`} />
            <p className="text-sm font-medium">
              {isOutOfStock ? 'Out of stock' : isLowStock ? `Only ${bike.stock} left` : `${bike.stock} in stock`}
            </p>
          </div>

          {/* Add to cart */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <input type="number" min="1" max={bike.stock} value={qty}
              onChange={e => setQty(Number(e.target.value))}
              className="input !w-20 text-center" disabled={isOutOfStock} />
            <button onClick={handleAddToCart} disabled={isOutOfStock}
              className="btn-primary flex-1 disabled:opacity-40">
              {isOutOfStock ? 'Out of stock' : '🛒 Add to cart'}
            </button>
            <button onClick={toggleWishlist} className="btn-icon" title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
              {wishlisted ? '❤️' : '🤍'}
            </button>
          </div>

          {cartMsg && <p className="mt-3 text-sm font-semibold text-green-700 animate-rise dark:text-green-400">{cartMsg}</p>}

          {bike.forRent && (
            <Link to={`/rentals/${bike.slug}`} className="btn-secondary mt-4 inline-flex">
              🚲 Rent this bike instead →
            </Link>
          )}
        </Reveal>
      </div>

      {/* Reviews */}
      <div className="mt-20 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="font-display text-xl font-bold">Customer reviews</h2>
          {bike.Reviews?.length === 0 ? (
            <p className="mt-4 text-sm text-ink-400 dark:text-white/50">No reviews yet — be the first!</p>
          ) : (
            <div className="mt-5 space-y-4">
              {bike.Reviews?.map(r => (
                <div key={r.id} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest/10 text-xs font-bold text-forest dark:bg-forest/30 dark:text-amber">
                        {r.User?.name?.[0]}
                      </div>
                      <p className="text-sm font-semibold">{r.User?.name}</p>
                    </div>
                    <StarRating value={r.rating} />
                  </div>
                  {r.comment && <p className="mt-3 text-sm text-ink-500 dark:text-white/65">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-display text-xl font-bold">Write a review</h2>
          <form onSubmit={submitReview} className="card mt-5 p-5">
            <label className="label">Rating</label>
            <select className="input" value={review.rating}
              onChange={e => setReview({...review, rating: Number(e.target.value)})}>
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{'⭐'.repeat(n)} {n} star{n !== 1 ? 's' : ''}</option>)}
            </select>
            <label className="label mt-4">Comment</label>
            <textarea className="input" rows="4" value={review.comment}
              onChange={e => setReview({...review, comment: e.target.value})} required
              placeholder="Share your experience with this product…" />
            <button type="submit" className="btn-primary mt-4 w-full">
              {user ? 'Submit review' : 'Sign in to review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
