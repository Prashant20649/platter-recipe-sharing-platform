import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
  showLabel = false
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const currentRating = interactive ? hoverRating || rating : rating;

  return (
    <div className="flex items-center gap-1.5" role={interactive ? 'radiogroup' : 'img'} aria-label={`Rating: ${rating} out of ${maxStars}`}>
      <div className="flex items-center">
        {Array.from({ length: maxStars }, (_, index) => {
          const starValue = index + 1;
          const isFilled = currentRating >= starValue;
          const isPartiallyFilled = !isFilled && currentRating > index && currentRating < starValue;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onChange && onChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`p-0.5 transition-colors focus:outline-none ${
                interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'
              }`}
              aria-label={`${starValue} Star${starValue > 1 ? 's' : ''}`}
            >
              <Star
                className={`${starSizes[size] || starSizes.md} transition-colors ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : isPartiallyFilled
                    ? 'text-amber-400 fill-amber-400/50'
                    : 'text-stone-300 fill-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-stone-700 ml-1">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
}
