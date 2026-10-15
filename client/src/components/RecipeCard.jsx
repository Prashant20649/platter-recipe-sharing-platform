import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Heart, BookmarkPlus } from 'lucide-react';
import StarRating from './StarRating';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80';

export default function RecipeCard({ recipe, onCollectionClick, onFavoriteChange }) {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [imgSrc, setImgSrc] = useState(recipe.photoUrl || DEFAULT_IMAGE);
  const [favoriting, setFavoriting] = useState(false);

  const isFavorited = user?.favorites?.some(
    (id) => (typeof id === 'string' ? id : id._id || id) === recipe._id
  );

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.info('Please log in to save recipes to your favorites.');
      return;
    }

    try {
      setFavoriting(true);
      const res = await api.toggleFavorite(recipe._id);
      toast.success(res.message);
      await refreshUser();
      if (onFavoriteChange) onFavoriteChange(recipe._id, res.favorited);
    } catch (err) {
      toast.error(err.message || 'Could not update favorites.');
    } finally {
      setFavoriting(false);
    }
  };

  const handleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.info('Please log in to organize recipes into collections.');
      return;
    }
    if (onCollectionClick) {
      onCollectionClick(recipe);
    }
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
      {/* Image Container */}
      <Link to={`/recipes/${recipe._id}`} className="relative block aspect-[16/10] overflow-hidden bg-stone-100">
        <img
          src={imgSrc}
          alt={recipe.title}
          onError={() => setImgSrc(DEFAULT_IMAGE)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />

        {/* Badges on Image */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/90 backdrop-blur-md text-stone-800 shadow-sm">
            {recipe.cuisine}
          </span>
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-600/90 backdrop-blur-md text-white shadow-sm">
            {recipe.diet}
          </span>
          {recipe.status && recipe.status !== 'approved' && (
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider backdrop-blur-md shadow-sm ${
                recipe.status === 'pending'
                  ? 'bg-amber-500 text-white'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {recipe.status}
            </span>
          )}
        </div>

        {/* Action icons on Image */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {onCollectionClick && (
            <button
              onClick={handleBookmark}
              title="Add to Collection"
              aria-label="Add to collection"
              className="p-2 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-orange-600 shadow-md backdrop-blur-md transition-transform active:scale-90"
            >
              <BookmarkPlus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleToggleFavorite}
            disabled={favoriting}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Toggle favorite"
            className={`p-2 rounded-full backdrop-blur-md shadow-md transition-all active:scale-90 ${
              isFavorited
                ? 'bg-rose-500 text-white hover:bg-rose-600'
                : 'bg-white/90 text-stone-600 hover:text-rose-500 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Time and Views overlay at bottom of image */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white drop-shadow font-medium">
          <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
            <Clock className="w-3.5 h-3.5" />
            {recipe.totalTime || (recipe.prepTime || 0) + (recipe.cookTime || 0)} mins
          </span>
          <span className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
            <Eye className="w-3.5 h-3.5" />
            {recipe.viewCount || 0} views
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <StarRating rating={recipe.averageRating || 0} size="sm" />
            <span className="text-xs font-semibold text-stone-700">
              {Number(recipe.averageRating || 0).toFixed(1)}
            </span>
            <span className="text-xs text-stone-500">
              ({recipe.reviewCount || 0})
            </span>
          </div>
          {recipe.author?.name && (
            <span className="text-xs text-stone-500 truncate max-w-[120px]">
              by <span className="font-medium text-stone-700">{recipe.author.name}</span>
            </span>
          )}
        </div>

        <Link to={`/recipes/${recipe._id}`} className="block group-hover:text-orange-600 transition-colors">
          <h3 className="font-bold text-stone-900 text-lg leading-snug line-clamp-1 mb-1.5">
            {recipe.title}
          </h3>
        </Link>

        <p className="text-stone-600 text-xs sm:text-sm line-clamp-2 leading-relaxed flex-1 mb-4">
          {recipe.description}
        </p>

        {/* Footer info */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>{recipe.ingredients?.length || 0} ingredients</span>
          <Link
            to={`/recipes/${recipe._id}`}
            className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
          >
            View Recipe &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
