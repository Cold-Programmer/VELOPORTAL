import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import Reveal from '../components/Reveal';

export default function Rentals() {
  const [bikes, setBikes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/products', { params: { forRent: true, limit: 50 } })
      .then(r => setBikes(r.data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shown = filter ? bikes.filter(b => b.Category?.name === filter) : bikes;
  const cats  = [...new Set(bikes.map(b => b.Category?.name).filter(Boolean))];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-forest-dark to-forest py-16 text-white">
        <div className="section-sm">
          <Reveal>
            <p className="eyebrow text-amber">Rentals</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">Rent a bike by the hour</h1>
            <p className="mt-3 max-w-xl text-white/65">Check live availability, pick your window, and pay instantly with M-Pesa. Average checkout: 3 minutes.</p>
          </Reveal>
          {/* Process steps */}
          <div className="mt-10 flex flex-wrap gap-6">
            {[
              { icon: '🔍', step: '1', label: 'Pick a bike' },
              { icon: '📅', step: '2', label: 'Choose your hours' },
              { icon: '📱', step: '3', label: 'Pay via M-Pesa' },
              { icon: '🚲', step: '4', label: 'Ride away' },
            ].map(s => (
              <div key={s.step} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber/20 font-display text-sm font-bold text-amber">{s.step}</div>
                <span className="text-sm text-white/75">{s.icon} {s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        {/* Category filter */}
        {cats.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button onClick={() => setFilter('')}
              className={`btn-tab text-sm ${!filter ? 'bg-forest text-white' : 'bg-sand-100 text-ink-400 hover:bg-forest/8 dark:bg-white/10 dark:text-white/60'}`}>
              All bikes
            </button>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`btn-tab text-sm ${filter === c ? 'bg-forest text-white' : 'bg-sand-100 text-ink-400 hover:bg-forest/8 dark:bg-white/10 dark:text-white/60'}`}>
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse aspect-[4/3] rounded-2xl bg-ink-100 dark:bg-white/5" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="py-20 text-center text-ink-400">No rental bikes available in this category right now.</p>
        ) : (
          <div className="grid gap-5 stagger sm:grid-cols-2 lg:grid-cols-3">
            {shown.map(b => (
              <Link key={b.id} to={`/rentals/${b.slug}`}
                className="card card-hover group overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2">
                <div className="relative aspect-[4/3] overflow-hidden bg-sand-100 dark:bg-forest-dark/50">
                  <img src={b.images?.[0]} alt={b.name} loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  {b.stock < 3 && b.stock > 0 && (
                    <span className="absolute left-3 top-3 badge badge-warning">Only {b.stock} left</span>
                  )}
                  {b.stock === 0 && (
                    <span className="absolute left-3 top-3 badge badge-danger">Unavailable</span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-amber-dark">{b.Category?.name}</p>
                  <h3 className="mt-1 font-display text-base font-semibold">{b.name}</h3>
                  <p className="text-xs text-ink-400 dark:text-white/50">{b.brand} · Frame {b.frameSize} · Wheel {b.wheelSize}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="font-display text-xl font-bold text-forest dark:text-amber">
                        KES {Number(b.rentalPricePerHour).toLocaleString()}
                      </p>
                      <p className="text-xs text-ink-400">per hour</p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest/8 text-forest transition-all duration-300 group-hover:bg-forest group-hover:text-white dark:bg-white/10 dark:text-white">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
