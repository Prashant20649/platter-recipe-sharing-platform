import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  Users,
  Eye,
  Heart,
  BookmarkPlus,
  Send,
  Star,
  CheckCircle2,
  Trash2,
  Edit3,
  MessageCircle,
  Share2,
  ArrowLeft,
  ChefHat
} from 'lucide-react';
import { api } from '../services/api';
import StarRating from '../components/StarRating';
import CollectionModal from '../components/CollectionModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=1200&q=80';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, settings, refreshUser } = useAuth();
  const toast = useToast();

  const [recipe, setRecipe] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedIngredients, setCheckedIngredients] = useState({});

  // Collection modal
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  // Message modal
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchRecipeAndReviews = useCallback(async () => {
    try {
      setLoading(true);
      const [recipeData, reviewsData] = await Promise.all([
        api.getRecipeById(id),
        api.getRecipeReviews(id)
      ]);
      setRecipe(recipeData.recipe);
      setReviews(reviewsData.reviews || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load recipe details.');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchRecipeAndReviews();
    window.scrollTo(0, 0);
  }, [fetchRecipeAndReviews]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
        <p className="text-stone-500 text-sm">Preparing recipe...</p>
      </div>
    );
  }

  if (!recipe) return null;

  const isFavorited = user?.favorites?.some(
    (favId) => (typeof favId === 'string' ? favId : favId._id || favId) === recipe._id
  );

  const userReview = reviews.find(
    (r) => (typeof r.user === 'string' ? r.user : r.user?._id) === user?._id
  );

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.info('Please log in to save recipes to your favorites.');
      return;
    }
    try {
      const res = await api.toggleFavorite(recipe._id);
      toast.success(res.message);
      await refreshUser();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle favorite.');
    }
  };

  const handleToggleIngredient = (index) => {
    setCheckedIngredients((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please log in to write a review.');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a short review comment.');
      return;
    }

    try {
      setSubmittingReview(true);
      if (editingReviewId) {
        await api.updateReview(editingReviewId, { rating, comment: comment.trim() });
        toast.success('Your review was updated successfully!');
        setEditingReviewId(null);
      } else {
        await api.addReview(recipe._id, { rating, comment: comment.trim() });
        toast.success('Thank you! Your review was submitted successfully.');
      }
      setComment('');
      setRating(5);
      await fetchRecipeAndReviews();
    } catch (err) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStartEditReview = (rev) => {
    setEditingReviewId(rev._id);
    setRating(rev.rating);
    setComment(rev.comment);
    // Scroll down to review form
    document.getElementById('review-form-anchor')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await api.deleteReview(reviewId);
      toast.success('Review deleted successfully.');
      await fetchRecipeAndReviews();
    } catch (err) {
      toast.error(err.message || 'Failed to delete review.');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Please log in to message the chef.');
      return;
    }
    if (!messageContent.trim()) {
      toast.error('Please write a message.');
      return;
    }

    try {
      setSendingMessage(true);
      await api.sendMessage({
        recipientId: recipe.author._id,
        recipeId: recipe._id,
        content: messageContent.trim()
      });
      toast.success(`Message sent to ${recipe.author.name}!`);
      setMessageContent('');
      setShowMessageModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.title,
        text: recipe.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Recipe link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Top Bar with back link */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-stone-600 hover:text-orange-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Recipes
        </Link>
      </div>

      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Hero Section */}
        <div className="bg-white rounded-3xl overflow-hidden border border-stone-200/80 shadow-md">
          {/* Hero Image */}
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-stone-100">
            <img
              src={recipe.photoUrl || DEFAULT_IMAGE}
              alt={recipe.title}
              onError={(e) => {
                e.target.src = DEFAULT_IMAGE;
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Badges on Hero */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-white/95 text-stone-900 shadow-sm backdrop-blur-md">
                {recipe.cuisine}
              </span>
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-orange-600 text-white shadow-sm backdrop-blur-md">
                {recipe.diet}
              </span>
              {recipe.status !== 'approved' && (
                <span className="px-3 py-1 text-xs font-extrabold uppercase rounded-full bg-amber-500 text-white shadow-sm backdrop-blur-md">
                  Status: {recipe.status}
                </span>
              )}
            </div>

            {/* Top Right Action Buttons */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={handleShare}
                title="Share Recipe"
                className="p-2.5 rounded-full bg-white/90 hover:bg-white text-stone-700 shadow-md backdrop-blur-md transition hover:scale-105"
                aria-label="Share recipe"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCollectionModal(true)}
                title="Save to Collection"
                className="p-2.5 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-orange-600 shadow-md backdrop-blur-md transition hover:scale-105"
                aria-label="Save to collection"
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleFavorite}
                title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                className={`p-2.5 rounded-full shadow-md backdrop-blur-md transition hover:scale-105 ${
                  isFavorited
                    ? 'bg-rose-500 text-white hover:bg-rose-600'
                    : 'bg-white/90 text-stone-700 hover:text-rose-500 hover:bg-white'
                }`}
                aria-label="Toggle favorite"
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-white' : ''}`} />
              </button>
            </div>

            {/* Title & Author Overlay at Bottom */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md mb-2 leading-tight">
                {recipe.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-200">
                <div className="flex items-center gap-2">
                  <img
                    src={
                      recipe.author?.avatar ||
                      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80'
                    }
                    alt={recipe.author?.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-white/50"
                  />
                  <span>
                    Created by{' '}
                    <strong className="text-white underline decoration-orange-400">
                      {recipe.author?.name}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white">
                    {Number(recipe.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="text-stone-300">({recipe.reviewCount || 0} reviews)</span>
                </div>

                <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <Eye className="w-4 h-4" />
                  <span>{recipe.viewCount || 0} views</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-100 bg-stone-50/70 p-4 sm:p-5 text-center">
            <div className="py-2 sm:py-0">
              <span className="text-xs text-stone-500 font-medium uppercase tracking-wider block">
                Prep Time
              </span>
              <span className="text-base sm:text-lg font-bold text-stone-900 flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-4 h-4 text-orange-600" />
                {recipe.prepTime || 15} mins
              </span>
            </div>

            <div className="py-2 sm:py-0">
              <span className="text-xs text-stone-500 font-medium uppercase tracking-wider block">
                Cook Time
              </span>
              <span className="text-base sm:text-lg font-bold text-stone-900 flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-4 h-4 text-orange-600" />
                {recipe.cookTime || 20} mins
              </span>
            </div>

            <div className="py-2 sm:py-0">
              <span className="text-xs text-stone-500 font-medium uppercase tracking-wider block">
                Total Time
              </span>
              <span className="text-base sm:text-lg font-bold text-stone-900 flex items-center justify-center gap-1 mt-0.5">
                <Clock className="w-4 h-4 text-orange-600" />
                {recipe.totalTime || (recipe.prepTime || 0) + (recipe.cookTime || 0)} mins
              </span>
            </div>

            <div className="py-2 sm:py-0">
              <span className="text-xs text-stone-500 font-medium uppercase tracking-wider block">
                Servings
              </span>
              <span className="text-base sm:text-lg font-bold text-stone-900 flex items-center justify-center gap-1 mt-0.5">
                <Users className="w-4 h-4 text-orange-600" />
                {recipe.servings || 4} portions
              </span>
            </div>
          </div>
        </div>

        {/* Recipe Summary & Description */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
          <h2 className="text-lg font-bold text-stone-900 mb-3">About this Dish</h2>
          <p className="text-stone-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {recipe.description}
          </p>

          {/* Author Card & Message Action */}
          <div className="mt-6 pt-6 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-orange-50/50 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <img
                src={
                  recipe.author?.avatar ||
                  'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80'
                }
                alt={recipe.author?.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-500/30"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-orange-600" />
                  <span className="font-bold text-stone-900 text-sm">{recipe.author?.name}</span>
                </div>
                <p className="text-xs text-stone-600 line-clamp-1 max-w-md">
                  {recipe.author?.bio || 'Passionate culinary creator on Platter.'}
                </p>
              </div>
            </div>

            {user && user._id !== recipe.author?._id && (
              <button
                onClick={() => setShowMessageModal(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-orange-600 hover:text-white text-stone-800 text-xs font-bold rounded-xl border border-stone-200 shadow-xs transition"
              >
                <MessageCircle className="w-4 h-4" /> Message Chef
              </button>
            )}
          </div>
        </div>

        {/* 2-Column: Ingredients Checklist & Step-by-Step Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ingredients Column (1 col) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-stone-900">Ingredients</h2>
                <span className="text-xs font-semibold px-2 py-0.5 bg-stone-100 text-stone-600 rounded-md">
                  {recipe.ingredients?.length || 0} items
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-4">
                Check off ingredients as you prepare your mise en place:
              </p>

              <ul className="space-y-2.5">
                {recipe.ingredients?.map((item, idx) => {
                  const isChecked = Boolean(checkedIngredients[idx]);
                  return (
                    <li
                      key={idx}
                      onClick={() => handleToggleIngredient(idx)}
                      className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition select-none text-xs sm:text-sm ${
                        isChecked
                          ? 'bg-emerald-50/70 text-stone-400 line-through'
                          : 'hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                      />
                      <span className="leading-snug">{item}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Instructions Column (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs">
              <h2 className="text-lg font-bold text-stone-900 mb-2">Step-by-Step Instructions</h2>
              <p className="text-xs text-stone-400 mb-6">
                Follow each step carefully for restaurant-grade execution:
              </p>

              <div className="space-y-6">
                {recipe.instructions?.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4 group">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 font-extrabold text-sm flex items-center justify-center shrink-0 ring-4 ring-orange-50 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                      {idx + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
                        {step}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ratings and Reviews Section */}
        <section id="reviews-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                Community Ratings & Reviews
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Real feedback from home cooks and food lovers
              </p>
            </div>

            <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100">
              <StarRating rating={recipe.averageRating || 0} size="md" />
              <div className="text-left">
                <span className="font-extrabold text-stone-900 text-base leading-none block">
                  {Number(recipe.averageRating || 0).toFixed(1)} / 5.0
                </span>
                <span className="text-[11px] text-stone-500">
                  {reviews.length} total review{reviews.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* System Settings: Check if reviews allowed */}
          {!settings?.allowReviews ? (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-center text-xs text-stone-500">
              Reviews are currently turned off platform-wide by system administration.
            </div>
          ) : (
            <>
              {/* Review Form Anchor */}
              <div id="review-form-anchor">
                {user ? (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-stone-800">
                        {editingReviewId ? 'Edit Your Review' : userReview ? 'Update Your Existing Review' : 'Leave a Review'}
                      </h3>
                      {editingReviewId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewId(null);
                            setComment('');
                            setRating(5);
                          }}
                          className="text-xs text-stone-500 hover:text-stone-800 underline"
                        >
                          Cancel Edit
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                        Your Star Rating:
                      </label>
                      <StarRating
                        rating={rating}
                        interactive={true}
                        size="lg"
                        onChange={(val) => setRating(val)}
                        showLabel={true}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1.5">
                        Your Feedback / Notes:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="How did your recipe turn out? Any ingredient substitutes or tips for fellow home chefs?"
                        className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                      >
                        {submittingReview
                          ? 'Submitting...'
                          : editingReviewId
                          ? 'Save Updated Review'
                          : 'Post Review'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-5 bg-orange-50/60 rounded-2xl border border-orange-100 text-center space-y-2">
                    <p className="text-xs sm:text-sm font-semibold text-stone-800">
                      Cooked this recipe? Share your experience with the community!
                    </p>
                    <Link
                      to="/login"
                      className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition"
                    >
                      Log in to Review
                    </Link>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-4 pt-2">
                {reviews.length === 0 ? (
                  <p className="text-center py-6 text-stone-400 text-xs">
                    No reviews yet. Be the first to try this recipe and share your rating!
                  </p>
                ) : (
                  reviews.map((rev) => {
                    const isAuthorOfReview =
                      user &&
                      (typeof rev.user === 'string'
                        ? rev.user === user._id
                        : rev.user?._id === user._id);
                    const isAdmin = user?.role === 'admin';

                    return (
                      <div
                        key={rev._id}
                        className="p-4 sm:p-5 rounded-2xl border border-stone-100 bg-stone-50/40 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                rev.user?.avatar ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
                              }
                              alt={rev.user?.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-200"
                            />
                            <div>
                              <div className="text-xs font-bold text-stone-900">
                                {rev.user?.name || 'Explorer'}
                              </div>
                              <div className="text-[11px] text-stone-400">
                                {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <StarRating rating={rev.rating} size="sm" />
                            {isAuthorOfReview && (
                              <button
                                onClick={() => handleStartEditReview(rev)}
                                className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition"
                                title="Edit your review"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {(isAuthorOfReview || isAdmin) && (
                              <button
                                onClick={() => handleDeleteReview(rev._id)}
                                className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title={isAdmin && !isAuthorOfReview ? 'Remove review (Admin)' : 'Delete review'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed pl-11">
                          {rev.comment}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </section>
      </article>

      {/* Collection Modal */}
      <CollectionModal
        recipe={recipe}
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
      />

      {/* Direct Message Chef Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-stone-900 text-base">
                  Message {recipe.author?.name}
                </h3>
              </div>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Regarding recipe: <span className="font-semibold text-stone-800">{recipe.title}</span>
            </p>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <textarea
                rows={4}
                required
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                placeholder="Ask about culinary techniques, flour substitutes, oven temperatures..."
                className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
