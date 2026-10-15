import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Compass,
  History,
  Star,
  Bookmark,
  User as UserIcon,
  Trash2,
  Edit2,
  ExternalLink,
  Plus,
  Folder,
  Heart,
  Clock,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StarRating from '../components/StarRating';

export default function ExplorerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'history';

  const { user, updateProfile, refreshUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // History State
  const [history, setHistory] = useState([]);

  // Reviews State
  const [myReviews, setMyReviews] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  // Collections State
  const [collections, setCollections] = useState([]);
  const [showCreateColModal, setShowCreateColModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [renamingCol, setRenamingCol] = useState(null);
  const [renameVal, setRenameVal] = useState('');

  // Profile State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [histRes, revRes, colRes, favRes] = await Promise.all([
        api.getHistory(),
        api.getMyReviews(),
        api.getCollections(),
        api.getFavorites()
      ]);

      setHistory(histRes.history || []);
      setMyReviews(revRes.reviews || []);
      setCollections(colRes.collections || []);
      setFavorites(favRes.favorites || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load explorer data.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // History Actions
  const handleRemoveHistoryItem = async (id) => {
    try {
      await api.removeHistoryItem(id);
      setHistory((prev) => prev.filter((h) => h._id !== id));
      toast.success('Removed from browsing history.');
    } catch (err) {
      toast.error('Failed to remove history item.');
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all your browsing history?')) return;
    try {
      await api.clearHistory();
      setHistory([]);
      toast.success('Browsing history cleared.');
    } catch (err) {
      toast.error('Failed to clear history.');
    }
  };

  // Review Actions
  const handleStartEditReview = (r) => {
    setEditingReview(r);
    setEditRating(r.rating);
    setEditComment(r.comment);
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!editingReview) return;
    try {
      await api.updateReview(editingReview._id, {
        rating: editRating,
        comment: editComment.trim()
      });
      toast.success('Review updated successfully!');
      setEditingReview(null);
      const revRes = await api.getMyReviews();
      setMyReviews(revRes.reviews || []);
    } catch (err) {
      toast.error(err.message || 'Failed to update review.');
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.deleteReview(id);
      toast.success('Review deleted.');
      setMyReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.message || 'Failed to delete review.');
    }
  };

  // Collection Actions
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    try {
      const res = await api.createCollection({
        name: newColName.trim(),
        description: newColDesc.trim()
      });
      toast.success(res.message);
      setNewColName('');
      setNewColDesc('');
      setShowCreateColModal(false);
      const colRes = await api.getCollections();
      setCollections(colRes.collections || []);
    } catch (err) {
      toast.error(err.message || 'Could not create collection.');
    }
  };

  const handleRenameCollection = async (e) => {
    e.preventDefault();
    if (!renamingCol || !renameVal.trim()) return;
    try {
      const res = await api.updateCollection(renamingCol._id, { name: renameVal.trim() });
      toast.success(res.message);
      setRenamingCol(null);
      const colRes = await api.getCollections();
      setCollections(colRes.collections || []);
    } catch (err) {
      toast.error(err.message || 'Could not rename collection.');
    }
  };

  const handleDeleteCollection = async (col) => {
    if (!window.confirm(`Delete collection '${col.name}'?`)) return;
    try {
      const res = await api.deleteCollection(col._id);
      toast.success(res.message);
      setCollections((prev) => prev.filter((c) => c._id !== col._id));
    } catch (err) {
      toast.error(err.message || 'Could not delete collection.');
    }
  };

  const handleRemoveRecipeFromCol = async (colId, recipeId) => {
    try {
      const res = await api.removeRecipeFromCollection(colId, recipeId);
      toast.success(res.message);
      const colRes = await api.getCollections();
      setCollections(colRes.collections || []);
    } catch (err) {
      toast.error(err.message || 'Failed to remove recipe.');
    }
  };

  // Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const updateData = {
        name: profileName.trim(),
        email: profileEmail.trim(),
        bio: profileBio.trim()
      };
      if (profilePassword) updateData.password = profilePassword;

      const res = await updateProfile(updateData);
      toast.success(res.message || 'Profile updated successfully!');
      setProfilePassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 to-stone-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
            <Compass className="w-3.5 h-3.5" /> Explorer Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Personal Tastebook & History
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm mt-1">
            Organize personal recipe collections, review dishes you have cooked, and revisit past culinary discoveries.
          </p>
        </div>

        {/* Quick summary counts */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 font-bold uppercase">Collections</span>
            <div className="text-xl font-extrabold text-white">{collections.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 font-bold uppercase">Reviews</span>
            <div className="text-xl font-extrabold text-white">{myReviews.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
            <span className="text-[10px] text-emerald-200 font-bold uppercase">Favorites</span>
            <div className="text-xl font-extrabold text-white">{favorites.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Browsing History</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
            {history.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('reviews')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>My Ratings & Reviews</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
            {myReviews.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('collections')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'collections'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Recipe Collections</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
            {collections.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('profile')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile & Favorites</span>
        </button>
      </div>

      {/* Tab 1: Browsing History */}
      {activeTab === 'history' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Previously Viewed Recipes</h2>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear History
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] font-bold border-b border-stone-200">
                  <tr>
                    <th className="py-3.5 px-4">Recipe Title</th>
                    <th className="py-3.5 px-4">Cuisine</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4">Viewed At</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-stone-400">
                        No recipe browsing history yet. Explore recipes on the home page!
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => {
                      if (!h.recipe) return null;
                      return (
                        <tr key={h._id} className="hover:bg-stone-50/60 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={
                                  h.recipe.photoUrl ||
                                  'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=100&q=80'
                                }
                                alt={h.recipe.title}
                                className="w-10 h-10 rounded-xl object-cover shrink-0"
                              />
                              <Link
                                to={`/recipes/${h.recipe._id}`}
                                className="font-bold text-stone-900 hover:text-orange-600 flex items-center gap-1"
                              >
                                {h.recipe.title}
                                <ExternalLink className="w-3 h-3 text-stone-400" />
                              </Link>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-700">
                              {h.recipe.cuisine || 'Global'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-stone-800">
                            {h.recipe.author?.name || 'Chef'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-stone-500">
                            {new Date(h.viewedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}{' '}
                            &bull; {new Date(h.viewedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleRemoveHistoryItem(h._id)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Remove from history"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: My Ratings and Reviews */}
      {activeTab === 'reviews' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Your Submitted Recipe Reviews</h2>
            <span className="text-xs text-stone-500">{myReviews.length} total reviews</span>
          </div>

          <div className="space-y-4">
            {myReviews.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center text-stone-400 text-sm">
                You haven't reviewed any recipes yet. Browse recipes and share your feedback!
              </div>
            ) : (
              myReviews.map((r) => (
                <div
                  key={r._id}
                  className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={
                        r.recipe?.photoUrl ||
                        'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=100&q=80'
                      }
                      alt={r.recipe?.title}
                      className="w-14 h-14 rounded-2xl object-cover shrink-0"
                    />

                    <div className="space-y-1 flex-1">
                      <Link
                        to={`/recipes/${r.recipe?._id}`}
                        className="font-bold text-stone-900 hover:text-orange-600 text-sm sm:text-base flex items-center gap-1"
                      >
                        {r.recipe?.title || 'Unknown Recipe'}
                        <ExternalLink className="w-3 h-3 text-stone-400" />
                      </Link>

                      <div className="flex items-center gap-2">
                        <StarRating rating={r.rating} size="sm" />
                        <span className="text-xs font-bold text-stone-700">{r.rating} / 5</span>
                        <span className="text-stone-300">&bull;</span>
                        <span className="text-[11px] text-stone-400">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-stone-700 text-xs sm:text-sm mt-2 leading-relaxed bg-stone-50 p-3 rounded-xl">
                        "{r.comment}"
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => handleStartEditReview(r)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReview(r._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Tab 3: Recipe Collections */}
      {activeTab === 'collections' && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-stone-900">Your Recipe Collections</h2>
              <p className="text-xs text-stone-500">
                Organize favorite recipes into curated folders for meal prep, holidays, or dinner parties.
              </p>
            </div>
            <button
              onClick={() => setShowCreateColModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> New Collection
            </button>
          </div>

          {collections.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center text-stone-400 text-sm">
              You haven't created any collections yet. Click 'New Collection' to get started!
            </div>
          ) : (
            <div className="space-y-6">
              {collections.map((col) => (
                <div
                  key={col._id}
                  className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-stone-900 text-base">{col.name}</h3>
                        {col.description && (
                          <p className="text-xs text-stone-500">{col.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setRenamingCol(col);
                          setRenameVal(col.name);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDeleteCollection(col)}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        Delete Collection
                      </button>
                    </div>
                  </div>

                  {/* Recipes inside this collection */}
                  {col.recipes?.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-2">
                      No recipes added to this collection yet. Browse recipes and tap the bookmark icon to save recipes here!
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {col.recipes.map((r) => (
                        <div
                          key={r._id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-stone-100 bg-stone-50/60 hover:bg-stone-50 transition"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <img
                              src={
                                r.photoUrl ||
                                'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=100&q=80'
                              }
                              alt={r.title}
                              className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                            <div className="truncate">
                              <Link
                                to={`/recipes/${r._id}`}
                                className="font-bold text-xs text-stone-900 hover:text-orange-600 truncate block"
                              >
                                {r.title}
                              </Link>
                              <span className="text-[10px] text-stone-400">{r.cuisine}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveRecipeFromCol(col._id, r._id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                            title="Remove from collection"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 4: Profile & Favorites */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h2 className="text-xl font-bold text-stone-900">Profile Management</h2>
              <p className="text-xs text-stone-500 mt-1">
                Update your personal explorer information.
              </p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Bio / Cooking Preferences
                </label>
                <textarea
                  rows={3}
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  placeholder="Tell the community what cuisines you enjoy exploring..."
                  className="w-full text-sm p-3.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Change Password (optional)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </section>

          {/* Favorited Recipes */}
          <section className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
            <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <h2 className="text-xl font-bold text-stone-900">Favorite Recipes</h2>
              </div>
              <span className="text-xs text-stone-500">{favorites.length} saved</span>
            </div>

            {favorites.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">
                You haven't favorited any recipes yet. Tap the heart icon on any recipe to save it here!
              </p>
            ) : (
              <div className="space-y-3">
                {favorites.map((fav) => (
                  <div
                    key={fav._id}
                    className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-stone-100 bg-stone-50/60 hover:bg-stone-50 transition"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <img
                        src={
                          fav.photoUrl ||
                          'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=100&q=80'
                        }
                        alt={fav.title}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                      />
                      <div className="truncate">
                        <Link
                          to={`/recipes/${fav._id}`}
                          className="font-bold text-xs sm:text-sm text-stone-900 hover:text-orange-600 block truncate"
                        >
                          {fav.title}
                        </Link>
                        <span className="text-[11px] text-stone-500">
                          by {fav.author?.name || 'Chef'} &bull; {fav.cuisine}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/recipes/${fav._id}`}
                      className="px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-lg shrink-0 transition"
                    >
                      View &rarr;
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Create Collection Modal */}
      {showCreateColModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-base">New Collection</h3>
              <button
                onClick={() => setShowCreateColModal(false)}
                className="text-stone-400 hover:text-stone-700 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunday Brunch, Quick Pasta..."
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="What is this collection for?"
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateColModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Collection Modal */}
      {renamingCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <h3 className="font-bold text-stone-900 text-base">Rename Collection</h3>
            <form onSubmit={handleRenameCollection} className="space-y-3.5">
              <input
                type="text"
                required
                value={renameVal}
                onChange={(e) => setRenameVal(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingCol(null)}
                  className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-base">Edit Review</h3>
              <button
                onClick={() => setEditingReview(null)}
                className="text-stone-400 hover:text-stone-700 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Rating:
                </label>
                <StarRating
                  rating={editRating}
                  interactive={true}
                  size="lg"
                  onChange={(val) => setEditRating(val)}
                  showLabel={true}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Review Text:
                </label>
                <textarea
                  rows={3}
                  required
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
