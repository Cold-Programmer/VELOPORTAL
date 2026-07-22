import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import Reveal from '../components/Reveal';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params, setParams]   = useSearchParams();
  const q = params.get('q') || '';

  const load = () => {
    setLoading(true);
    api.get('/events', { params: { q, upcoming: 'true' } })
      .then(r => setEvents(r.data.events))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [q]);

  const [input, setInput] = useState(q);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-forest to-forest-light py-16 text-white">
        <div className="section-sm">
          <Reveal>
            <p className="eyebrow text-amber">Events</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">Cycling events in Nairobi</h1>
            <p className="mt-3 max-w-xl text-white/65">Rallies, workshops, night rides, charity rides, skill clinics — join Nairobi's most active cycling community.</p>
          </Reveal>
          <form onSubmit={e => { e.preventDefault(); setParams({ q: input }); }}
            className="mt-8 flex max-w-md gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Search events…"
              className="input flex-1 !bg-white/15 !border-white/25 !text-white placeholder:!text-white/50 focus:!bg-white/20" />
            <button className="btn-amber">Search</button>
          </form>
        </div>
      </div>

      <div className="section">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card animate-pulse overflow-hidden">
                <div className="h-44 bg-ink-100 dark:bg-white/5" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-1/3 rounded bg-ink-100 dark:bg-white/5" />
                  <div className="h-4 w-2/3 rounded bg-ink-100 dark:bg-white/5" />
                  <div className="h-3 w-1/2 rounded bg-ink-100 dark:bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-5xl">🎉</p>
            <p className="mt-4 text-lg font-semibold">No upcoming events found</p>
            <p className="mt-1 text-sm text-ink-400">Check back soon — new events are added regularly.</p>
            {q && <button onClick={() => { setParams({}); setInput(''); }} className="btn-secondary mt-6">Clear search</button>}
          </div>
        ) : (
          <div className="grid gap-6 stagger sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e, i) => {
              const date = new Date(e.date);
              const isPast = date < new Date();
              return (
                <Link key={e.id} to={`/events/${e.slug}`} className="card card-hover overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2">
                  <div className="relative h-44 overflow-hidden bg-forest/20">
                    <img src={e.imageUrl} alt={e.title} loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent" />
                    {/* Date chip */}
                    <div className="absolute left-3 top-3 rounded-xl bg-white/95 px-3 py-2 text-center shadow-soft dark:bg-forest-dark/90">
                      <p className="text-2xs font-bold uppercase tracking-wider text-forest">{date.toLocaleString('default', { month: 'short' })}</p>
                      <p className="font-display text-xl font-bold text-ink leading-none dark:text-white">{date.getDate()}</p>
                    </div>
                    {Number(e.price) === 0 && (
                      <span className="absolute right-3 top-3 badge badge-success">Free</span>
                    )}
                    {isPast && (
                      <span className="absolute right-3 top-3 badge badge-ink">Past</span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-base font-semibold leading-snug">{e.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-400 dark:text-white/50">
                      📍 {e.location}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm font-bold text-forest dark:text-amber">
                        {Number(e.price) === 0 ? 'Free entry' : `KES ${Number(e.price).toLocaleString()}`}
                      </p>
                      <p className="text-2xs text-ink-400 dark:text-white/40">{e.capacity} capacity</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
