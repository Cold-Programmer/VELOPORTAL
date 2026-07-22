import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';

const STATS = [
  { value: '3 min', label: 'Average rental checkout' },
  { value: '0%', label: 'Double-bookings ever' },
  { value: '8+', label: 'Bicycle categories' },
  { value: '24/7', label: 'Online booking' },
];
const FAQS = [
  { q: 'How does hourly rental billing work?', a: 'Pick a start and end time, we calculate the total by the hour, and you pay instantly via M-Pesa STK push before pickup.' },
  { q: 'Can I return a rental bike late?', a: 'Yes — a late-return penalty is auto-calculated when the shop attendant checks your bike back in.' },
  { q: 'Do you service bikes bought elsewhere?', a: 'Absolutely. Our repair booking accepts any brand or model, not just bikes purchased on VeloPortal.' },
  { q: 'Is M-Pesa the only payment option?', a: 'M-Pesa STK push is the primary method; cash-on-delivery is available for select orders.' },
];

export default function Home() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [events,   setEvents]   = useState([]);
  const [openFaq,  setOpenFaq]  = useState(null);
  const [tilt,     setTilt]     = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api.get('/products/featured').then(r => setFeatured(r.data.items)).catch(() => {});
    api.get('/events?upcoming=true').then(r => setEvents(r.data.events.slice(0, 4))).catch(() => {});
  }, [user]);

  const handleMove = e => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 14;
    const y = ((e.clientY - rect.top)  / rect.height - 0.5) * -10;
    setTilt({ x, y });
  };

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-forest" onMouseMove={handleMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
        {/* Animated gradient orbs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-forest-light/30 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -right-16 top-1/2 h-80 w-80 rounded-full bg-amber/15 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-2 lg:px-8 lg:py-32">
          {/* Copy */}
          <div className="z-10 animate-slide-up">
            <span className="eyebrow text-amber inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/10 px-4 py-1.5 text-xs">
              🚲 Nairobi's bicycle ecosystem
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Buy. Rent.<br />
              <span className="text-amber">Repair.</span><br />
              Belong.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/65 sm:text-lg">
              One platform for Nairobi's cycling community — from first-time commuters to seasoned trail riders.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={user ? '/shop' : '/register'} className="btn-amber">
                {user ? '🛒 Browse bicycles' : '🚀 Get started — it\'s free'}
              </Link>
              <Link to="/rentals" className="btn-secondary !border-white/30 !text-white hover:!bg-white hover:!text-forest-dark">
                Rent by the hour →
              </Link>
            </div>
          </div>

          {/* Hero image with parallax tilt */}
          <div ref={heroRef} className="relative z-10 mx-auto w-full max-w-md lg:max-w-none">
            <div className="transition-transform duration-300 ease-out"
              style={{ transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}>
              <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <img src="https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=900&q=80"
                  alt="Bicycle fleet lined up in Nairobi"
                  className="w-full aspect-[4/3] object-cover" loading="eager" />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-dark/60 via-transparent" />
              </div>
              {/* Floating stat chips */}
              <div className="absolute -bottom-5 -left-4 glass-dark rounded-2xl px-5 py-3.5 animate-rise shadow-modal">
                <p className="font-display text-2xl font-bold text-white">3 min</p>
                <p className="text-xs text-white/60">avg. checkout time</p>
              </div>
              <div className="absolute -top-4 -right-4 rounded-2xl bg-amber px-5 py-3.5 animate-pop shadow-amber">
                <p className="font-display text-2xl font-bold text-forest-dark">0%</p>
                <p className="text-xs text-forest-dark/70">double-bookings</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <div className="border-y border-ink-100 bg-white dark:bg-forest-dark dark:border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 divide-x divide-ink-100 sm:grid-cols-4 dark:divide-white/10">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.07} className="px-6 py-6 text-center sm:py-8">
                <p className="font-display text-2xl font-bold text-forest dark:text-amber sm:text-3xl">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-ink-400 dark:text-white/50">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured products (only shown to signed-in users) ─────── */}
      {user && featured.length > 0 && (
        <section className="section">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow">Featured</p>
              <h2 className="section-title mt-2">Popular right now</h2>
            </div>
            <Link to="/shop" className="btn-ghost hidden text-sm sm:inline-flex">View all →</Link>
          </div>
          <div className="grid gap-5 stagger sm:grid-cols-2 lg:grid-cols-4">
            {featured.map(b => <ProductCard key={b.id} bike={b} />)}
          </div>
        </section>
      )}

      {/* ── Sign-up prompt for non-users ─────────────────────────── */}
      {!user && (
        <section className="section">
          <Reveal className="rounded-4xl bg-gradient-to-br from-forest to-forest-light p-10 text-center text-white sm:p-16">
            <span className="eyebrow text-amber">Join for free</span>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Create an account to start riding</h2>
            <p className="mx-auto mt-4 max-w-md text-white/65">Access the shop, book rentals, reserve repair slots, and join Nairobi's cycling community — all in one place.</p>
            <div className="mt-8 flex justify-center gap-3">
              <Link to="/register" className="btn-amber">Create free account</Link>
              <Link to="/login"    className="btn-secondary !border-white/30 !text-white hover:!bg-white hover:!text-forest">Sign in →</Link>
            </div>
          </Reveal>
        </section>
      )}

      {/* ── Services grid ────────────────────────────────────────── */}
      <section className="section bg-sand-100 dark:bg-transparent">
        <Reveal className="text-center mb-12">
          <p className="eyebrow">Everything in one place</p>
          <h2 className="section-title mt-2">What VeloPortal offers</h2>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 stagger">
          {[
            { icon: '🛒', title: 'Buy bicycles, accessories & equipment', desc: 'Shop from 8 categories — mountain, road, hybrid, electric, BMX, folding, kids, and cruiser — plus helmets, locks, tools, and more.', to: '/shop', btn: 'Shop now' },
            { icon: '🚲', title: 'Rent by the hour', desc: 'Book any available bike for exactly how long you need it. Live availability checks, M-Pesa payment, instant digital receipt.', to: '/rentals', btn: 'Browse fleet' },
            { icon: '🔧', title: 'Build your custom bike', desc: 'Pick a frame, fork, wheels, handlebar, and drivetrain. Our compatibility engine checks mechanical fit before you can save.', to: '/customize', btn: 'Open customizer' },
            { icon: '⚙️', title: 'Expert repairs', desc: 'Book a certified mechanic — basic tune-up to full overhaul. Track your repair status from booking to collection.', to: '/repair', btn: 'Book repair' },
            { icon: '🎉', title: 'Cycling events', desc: 'Campus rallies, night rides, trail adventures, and skill workshops. Register online, get your ticket code, show up and ride.', to: '/events', btn: 'See events' },
            { icon: '🌍', title: 'Rider community', desc: 'Post ride updates, ask tech questions, share routes, and meet other cyclists in Nairobi.', to: '/community', btn: 'Join community' },
          ].map(s => (
            <div key={s.title} className="card card-hover p-7 flex flex-col">
              <span className="text-4xl">{s.icon}</span>
              <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 grow text-sm leading-relaxed text-ink-400 dark:text-white/55">{s.desc}</p>
              <Link to={s.to} className="btn-primary mt-6 self-start !px-5 !py-2.5 text-sm">{s.btn}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Events teaser ────────────────────────────────────────── */}
      {user && events.length > 0 && (
        <section className="section">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="eyebrow">What's on</p>
              <h2 className="section-title mt-2">Upcoming events</h2>
            </div>
            <Link to="/events" className="btn-ghost hidden sm:inline-flex">See all events →</Link>
          </div>
          <div className="grid gap-5 stagger sm:grid-cols-2 lg:grid-cols-4">
            {events.map(e => (
              <Link key={e.id} to={`/events/${e.slug}`} className="card card-hover overflow-hidden">
                <img src={e.imageUrl} alt={e.title} className="h-40 w-full object-cover" loading="lazy" />
                <div className="p-5">
                  <p className="eyebrow">{new Date(e.date).toDateString()}</p>
                  <h3 className="mt-2 font-display text-base font-semibold leading-snug">{e.title}</h3>
                  <p className="mt-1 text-xs text-ink-400 dark:text-white/50">{e.location}</p>
                  <p className="mt-3 text-sm font-bold text-forest dark:text-amber">
                    {Number(e.price) === 0 ? 'Free' : `KES ${Number(e.price).toLocaleString()}`}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="section bg-forest dark:bg-forest-dark">
        <Reveal className="text-center text-white mb-12">
          <p className="eyebrow text-amber">Riders say</p>
          <h2 className="font-display text-3xl font-bold mt-2">Trusted by Nairobi's cyclists</h2>
        </Reveal>
        <div className="grid gap-5 stagger sm:grid-cols-3">
          {[
            { name: 'Amina K.', role: 'KCA student', text: 'Cut my commute cost in half using the hourly rentals between classes. Checkout took literally 2 minutes.' },
            { name: 'David M.', role: 'Rider & hobbyist', text: 'Booked a full tune-up and tracked every stage of the repair from my phone. Picked up a perfectly tuned bike.' },
            { name: 'Faith O.', role: 'Campus cycling club', text: 'Organised our club group rental through VeloPortal. M-Pesa checkout is instant — no more waiting around at the shop.' },
          ].map(t => (
            <Reveal key={t.name} className="glass rounded-3xl p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber/20 font-display text-sm font-bold text-amber">{t.name[0]}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/50">{t.role}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-white/70">"{t.text}"</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="section-tight">
        <Reveal className="mb-10">
          <p className="eyebrow">FAQ</p>
          <h2 className="section-title mt-2">Questions, answered</h2>
        </Reveal>
        <div className="divide-y divide-ink-100 border-t border-ink-100 dark:divide-white/10 dark:border-white/10">
          {FAQS.map((f, i) => (
            <div key={f.q}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left">
                <span className="text-sm font-semibold sm:text-base">{f.q}</span>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-100 text-ink-400 transition-transform duration-300 dark:border-white/20 ${openFaq === i ? 'rotate-45 border-forest text-forest dark:border-amber dark:text-amber' : ''}`}>
                  +
                </span>
              </button>
              {openFaq === i && (
                <p className="pb-5 text-sm leading-relaxed text-ink-400 animate-rise dark:text-white/55">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <Reveal className="mx-4 mb-20 sm:mx-6 lg:mx-8">
        <div className="rounded-4xl bg-amber p-10 text-center sm:p-16">
          <h2 className="font-display text-3xl font-bold text-forest-dark sm:text-4xl">Ready to ride Nairobi?</h2>
          <p className="mx-auto mt-4 max-w-md text-forest-dark/70">Create a free account — takes 30 seconds.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/register" className="btn-primary">Create free account</Link>
            <Link to="/shop"     className="btn-secondary">Browse the shop →</Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
