import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

const links = [
  { to: '/shop',      label: 'Shop',      icon: '🛒' },
  { to: '/rentals',   label: 'Rentals',   icon: '🚲' },
  { to: '/customize', label: 'Customize', icon: '🔧' },
  { to: '/repair',    label: 'Repair',    icon: '⚙️' },
  { to: '/events',    label: 'Events',    icon: '🎉' },
  { to: '/community', label: 'Community', icon: '🌍' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isDark = theme === 'dark';

  return (
    <header className={`sticky top-0 z-40 transition-all duration-500 ${
      scrolled
        ? 'border-b border-ink-100 bg-white/90 shadow-soft backdrop-blur-md dark:bg-forest-dark/90 dark:border-white/10'
        : 'bg-white/60 backdrop-blur-sm dark:bg-transparent'
    }`}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Handlebar assembly ───────────────────────────────────────────
            The nav bar is styled as a bicycle handlebar:
            - Two circular "grip" ends (logo left, actions right)
            - A curved SVG tube connecting them
            - Nav items sit on the bar like grip-shift levers, lifting on hover
            ─────────────────────────────────────────────────────────────── */}
        <div className="relative flex h-16 items-center justify-between">
          {/* Left grip — logo */}
          <Link to="/" className="group relative z-10 flex items-center gap-2.5 shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-forest bg-white text-xl shadow-soft transition-all duration-300 group-hover:rotate-[15deg] group-hover:scale-110 group-hover:shadow-forest dark:bg-forest-dark">
              🚲
            </div>
            <span className="hidden font-display text-lg font-bold text-forest sm:block dark:text-white">
              Velo<span className="text-amber-dark">Portal</span>
            </span>
          </Link>

          {/* Handlebar tube — decorative SVG, desktop only */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-2 w-[560px] -translate-x-1/2 -translate-y-1/2 xl:block">
            <svg viewBox="0 0 560 8" preserveAspectRatio="none" className="h-full w-full">
              <path d="M0,4 C140,0 420,0 560,4" stroke="#16382A" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".12" />
            </svg>
          </div>

          {/* Nav items — grip-shift levers on the bar */}
          <div className="hidden items-center gap-0.5 xl:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) =>
                  `group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? 'bg-forest text-white shadow-forest'
                      : 'text-ink-400 hover:-translate-y-1 hover:bg-forest/6 hover:text-forest dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10'
                  }`}
              >
                <span className="transition-transform duration-300 group-hover:scale-110">{l.icon}</span>
                {l.label}
              </NavLink>
            ))}
          </div>

          {/* Right grip — actions */}
          <div className="relative z-10 flex items-center gap-2 shrink-0">
            {/* Dark mode toggle — rotates on switch */}
            <button onClick={toggleTheme} aria-label="Toggle dark mode"
              className="btn-icon dark:bg-white/10 dark:border-white/20 dark:text-white"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              <span className={`transition-transform duration-500 ${isDark ? 'rotate-180' : 'rotate-0'}`}>
                {isDark ? '☀️' : '🌙'}
              </span>
            </button>

            {/* Cart — wobbles when items change */}
            <Link to="/cart" aria-label="Cart"
              className="btn-icon relative dark:bg-white/10 dark:border-white/20 dark:text-white">
              🛒
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 animate-pop items-center justify-center rounded-full bg-amber text-[10px] font-bold text-forest-dark">
                  {items.length}
                </span>
              )}
            </Link>

            {/* Account — desktop */}
            {user ? (
              <div className="hidden items-center gap-2 xl:flex">
                <Link
                  to={['staff', 'mechanic', 'admin'].includes(user.role) ? '/admin' : '/dashboard'}
                  className="flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-sm font-semibold text-ink transition-all hover:border-forest hover:text-forest dark:bg-white/10 dark:border-white/10 dark:text-white dark:hover:border-amber">
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} className="h-5 w-5 rounded-full object-cover" alt="" />
                    : <span className="flex h-5 w-5 items-center justify-center rounded-full bg-forest/10 text-[10px] font-bold text-forest">{user.name[0]}</span>
                  }
                  {user.name.split(' ')[0]}
                  <span className="badge badge-forest capitalize text-[9px]">{user.role}</span>
                </Link>
                <button onClick={() => { logout(); navigate('/'); }}
                  className="btn-ghost text-xs dark:text-white/70 dark:hover:text-white">
                  Sign out
                </button>
              </div>
            ) : (
              <div className="hidden items-center gap-2 xl:flex">
                <Link to="/login"    className="btn-ghost text-sm dark:text-white/70">Sign in</Link>
                <Link to="/register" className="btn-primary !px-5 !py-2 text-sm">Get started</Link>
              </div>
            )}

            {/* Hamburger */}
            <button onClick={() => setOpen(o => !o)} aria-label="Toggle menu"
              className="xl:hidden flex flex-col gap-1.5 p-2">
              <span className={`block h-0.5 w-5 rounded bg-ink transition-all dark:bg-white ${open ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-5 rounded bg-ink transition-all dark:bg-white ${open ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 rounded bg-ink transition-all dark:bg-white ${open ? '-translate-y-2 -rotate-45' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="animate-slide-up border-t border-ink-100 bg-white px-4 py-5 shadow-modal xl:hidden dark:bg-forest-dark dark:border-white/10">
          <div className="grid grid-cols-2 gap-2">
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-forest/6 hover:text-forest dark:text-white/80 dark:hover:text-white dark:hover:bg-white/8">
                <span>{l.icon}</span>{l.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-ink-100 pt-4 dark:border-white/10">
            {user ? (
              <>
                <Link to={['staff','mechanic','admin'].includes(user.role) ? '/admin' : '/dashboard'} onClick={() => setOpen(false)}
                  className="btn-secondary justify-center">Dashboard</Link>
                <button onClick={() => { logout(); setOpen(false); navigate('/'); }} className="btn-ghost">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login"    onClick={() => setOpen(false)} className="btn-secondary justify-center">Sign in</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary  justify-center">Create account</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
