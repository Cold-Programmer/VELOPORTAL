import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 text-center py-20">
      <span className="animate-float text-8xl">🚲</span>
      <h1 className="mt-8 font-display text-5xl font-bold">404</h1>
      <p className="mt-3 text-xl font-semibold">This page took a wrong turn</p>
      <p className="mt-2 max-w-sm text-sm text-ink-400 dark:text-white/50">
        The route you're looking for doesn't exist. Maybe you meant to go somewhere else?
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">Go home</Link>
        <Link to="/shop" className="btn-secondary">Browse the shop</Link>
      </div>
    </div>
  );
}
