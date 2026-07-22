import React from 'react';
import { Link } from 'react-router-dom';

const SOCIALS = [
  { label: 'Twitter / X', icon: '𝕏',  href: 'https://twitter.com/veloportal',  cls: 'social-twitter' },
  { label: 'Instagram',   icon: '📸', href: 'https://instagram.com/veloportal', cls: 'social-instagram' },
  { label: 'Facebook',    icon: '👍', href: 'https://facebook.com/veloportal',  cls: 'social-facebook' },
  { label: 'YouTube',     icon: '▶️',  href: 'https://youtube.com/@veloportal', cls: 'social-youtube' },
  { label: 'TikTok',     icon: '🎵',  href: 'https://tiktok.com/@veloportal',  cls: 'social-tiktok' },
];

const COLS = [
  {
    title: 'Explore',
    links: [
      { to: '/shop',      label: 'Shop bicycles' },
      { to: '/shop?productType=accessory', label: 'Accessories' },
      { to: '/shop?productType=equipment', label: 'Equipment & tools' },
      { to: '/rentals',   label: 'Rent by the hour' },
      { to: '/customize', label: 'Bike customizer' },
    ],
  },
  {
    title: 'Services',
    links: [
      { to: '/repair',    label: 'Book a repair' },
      { to: '/events',    label: 'Upcoming events' },
      { to: '/community', label: 'Rider community' },
      { to: '/dashboard', label: 'Your dashboard' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/register', label: 'Create account' },
      { to: '/login',    label: 'Sign in' },
      { to: '/forgot-password', label: 'Reset password' },
      { to: '/admin',    label: 'Operations console' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-ink-100 bg-forest-dark text-white dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 text-xl">🚲</span>
              <span className="font-display text-xl font-bold">VeloPortal</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Nairobi's bicycle marketplace. Buy, rent by the hour, book expert repairs, join community events, and build your perfect bike.
            </p>
            {/* Social icons */}
            <div className="mt-6 flex items-center gap-4">
              {SOCIALS.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                   aria-label={s.label} title={s.label}
                   className={`social-link text-xl ${s.cls}`}>
                  {s.icon}
                </a>
              ))}
            </div>
            <p className="mt-5 text-xs text-white/35">
              Follow us for ride photos, tips, and event announcements.
            </p>
          </div>

          {/* Link columns */}
          {COLS.map(col => (
            <div key={col.title}>
              <p className="eyebrow text-amber">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(l => (
                  <li key={l.to}>
                    <Link to={l.to}
                      className="link-underline text-sm text-white/60 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 sm:flex-row">
          <p className="text-xs text-white/35">© {new Date().getFullYear()} VeloPortal · KCA University, School of Technology · Built by Elvis Muthomi (25/01220)</p>
          <p className="text-xs text-white/25">Diploma in Information Technology — STU701 · Supervisor: Madam Faith</p>
        </div>
      </div>
    </footer>
  );
}
