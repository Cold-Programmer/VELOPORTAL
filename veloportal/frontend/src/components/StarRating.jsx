import React from 'react';
export default function StarRating({ value = 0, count }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-1 text-amber-dark">
      {[1, 2, 3, 4, 5].map((i) => <span key={i}>{i <= full ? '★' : '☆'}</span>)}
      {count !== undefined && <span className="ml-1 text-xs text-ink/50">({count})</span>}
    </div>
  );
}
