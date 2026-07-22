import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from './StarRating';

const TYPE_LABELS = { bicycle: '🚲 Bicycle', accessory: '🛡️ Accessory', equipment: '🔧 Equipment' };
const LOW_STOCK_THRESHOLD = 5;

export default function ProductCard({ bike }) {
  const isLow = bike.stock > 0 && bike.stock <= LOW_STOCK_THRESHOLD;
  const isOut = bike.stock === 0;

  return (
    <Link to={`/shop/${bike.slug}`}
      className="card card-hover group flex flex-col overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-2">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-sand-100 dark:bg-forest-dark/50">
        <img src={bike.images?.[0]} alt={bike.name} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {/* Stock badge */}
        {isOut && (
          <span className="absolute left-3 top-3 badge badge-danger">Out of stock</span>
        )}
        {isLow && !isOut && (
          <span className="absolute left-3 top-3 badge badge-warning">Only {bike.stock} left</span>
        )}
        {bike.forRent && !isOut && (
          <span className="absolute right-3 top-3 badge badge-forest">Rentable</span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <p className="text-2xs font-semibold uppercase tracking-wider text-amber-dark">
          {TYPE_LABELS[bike.productType] || bike.Category?.name}
        </p>
        <h3 className="mt-1 font-display text-sm font-semibold leading-snug text-ink dark:text-white line-clamp-2">
          {bike.name}
        </h3>
        <p className="text-xs text-ink-400 dark:text-white/50">{bike.brand}</p>

        {bike.ratingCount > 0 && (
          <div className="mt-2">
            <StarRating value={Number(bike.ratingAvg)} count={bike.ratingCount} />
          </div>
        )}

        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <p className="font-display text-lg font-bold text-forest dark:text-amber">
              KES {Number(bike.price).toLocaleString()}
            </p>
            {bike.forRent && (
              <p className="text-2xs text-ink-400">
                KES {Number(bike.rentalPricePerHour).toLocaleString()}/hr rental
              </p>
            )}
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest/8 text-forest transition-all duration-300 group-hover:bg-forest group-hover:text-white dark:bg-white/10 dark:text-white dark:group-hover:bg-amber dark:group-hover:text-forest-dark">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
