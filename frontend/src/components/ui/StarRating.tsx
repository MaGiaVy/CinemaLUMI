'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const sizes = { sm: 'text-base', md: 'text-2xl', lg: 'text-3xl' };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = readonly ? star <= value : star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            className={`${sizes[size]} transition-transform duration-100 ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
            style={{ background: 'none', border: 'none', padding: 0 }}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            onClick={() => !readonly && onChange?.(star)}
          >
            <span style={{ color: filled ? '#FFB703' : '#404040' }}>★</span>
          </button>
        );
      })}
    </div>
  );
}
