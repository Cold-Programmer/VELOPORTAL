import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, total, updateQty, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return (
    <div className="section flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="text-6xl">🔒</span>
      <h1 className="mt-6 font-display text-2xl font-bold">Sign in to view your cart</h1>
      <p className="mt-2 text-ink-400 dark:text-white/50">Your cart is saved when you're signed in.</p>
      <Link to="/login" className="btn-primary mt-6">Sign in</Link>
    </div>
  );

  if (!items.length) return (
    <div className="section flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="text-6xl animate-float">🛒</span>
      <h1 className="mt-6 font-display text-2xl font-bold">Your cart is empty</h1>
      <p className="mt-2 text-ink-400 dark:text-white/50">Browse the shop to find bicycles, accessories, and equipment.</p>
      <Link to="/shop" className="btn-primary mt-6">Browse the shop</Link>
    </div>
  );

  return (
    <div className="section">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Your cart</h1>
      <p className="mt-1 text-sm text-ink-400 dark:text-white/50">{items.length} item{items.length !== 1 ? 's' : ''}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="space-y-4 lg:col-span-2">
          {items.map(item => (
            <div key={item.id} className="card flex gap-4 p-4 sm:p-5">
              <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-sand-100 dark:bg-white/5 sm:h-24 sm:w-28">
                <img src={item.Bicycle?.images?.[0]} alt={item.Bicycle?.name}
                  className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{item.Bicycle?.name}</p>
                    <p className="text-sm text-ink-400 dark:text-white/50">{item.Bicycle?.brand}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)}
                    className="shrink-0 rounded-full p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all">
                    ✕
                  </button>
                </div>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-100 text-sm font-bold hover:border-forest hover:text-forest dark:border-white/20 dark:hover:border-amber dark:hover:text-amber">−</button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-100 text-sm font-bold hover:border-forest hover:text-forest dark:border-white/20 dark:hover:border-amber dark:hover:text-amber">+</button>
                  </div>
                  <p className="font-display text-lg font-bold text-forest dark:text-amber">
                    KES {(Number(item.Bicycle?.price) * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-display text-lg font-bold">Order summary</h2>
            <div className="mt-5 space-y-2 text-sm">
              {items.map(i => (
                <div key={i.id} className="flex justify-between">
                  <span className="text-ink-400 dark:text-white/50 truncate max-w-[60%]">{i.Bicycle?.name} × {i.quantity}</span>
                  <span>KES {(Number(i.Bicycle?.price) * i.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-between border-t border-ink-100 pt-4 font-display text-xl font-bold dark:border-white/10">
              <span>Total</span>
              <span className="text-forest dark:text-amber">KES {Number(total).toLocaleString()}</span>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-primary mt-5 w-full">
              Proceed to checkout →
            </button>
            <Link to="/shop" className="btn-ghost mt-3 w-full justify-center text-sm dark:text-white/60">
              ← Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
