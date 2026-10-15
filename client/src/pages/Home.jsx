import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  SlidersHorizontal,
  Flame,
  Clock,
  Sparkles,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import RecipeCard from '../components/RecipeCard';
import CollectionModal from '../components/CollectionModal';
import { useAuth } from '../context/AuthContext';

const CUISINES = ['All', 'Italian', 'Asian', 'Mexican', 'French', 'Mediterranean', 'Bakery'];
const DIETS = ['All', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Omnivore'];

export default function Home() {
  const { settings } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [selectedDiet, setSelectedDiet] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [totalCount, setTotalCount] = useState(0);

  // Collection modal state
  const [selectedRecipeForCollection, setSelectedRecipeForCollection] = useState(null);

  const fetchRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedCuisine !== 'All') params.cuisine = selectedCuisine;
      if (selectedDiet !== 'All') params.diet = selectedDiet;
      if (sortBy) params.sort = sortBy;

      const data = await api.getRecipes(params);
      setRecipes(data.recipes || []);
      setTotalCount(data.total || data.count || 0);
    } catch (err) {
      console.error('Error fetching recipes:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCuisine, selectedDiet, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecipes();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchRecipes]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCuisine('All');
    setSelectedDiet('All');
    setSortBy('rating');
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-amber-50/40 to-stone-50 py-12 md:py-16 border-b border-orange-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            Welcome to {settings?.siteName || 'Platter'}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-stone-900 tracking-tight max-w-3xl mx-auto leading-tight sm:leading-none">
            Discover, Share & Savor{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
              Extraordinary Recipes
            </span>
          </h1>

          <p className="mt-4 text-stone-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            From artisanal sourdough and hand-rolled pasta to sizzling street noodles and wholesome bowls.
            Cook with confidence and connect with creators.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-stone-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by recipe title or ingredient (e.g., mushrooms, garlic, pad thai)..."
                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-stone-200 shadow-lg shadow-orange-950/5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-4 text-xs font-semibold text-stone-400 hover:text-stone-700 bg-stone-100 px-2 py-1 rounded-md"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-orange-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Filters & Sorting Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
          {/* Cuisine pills */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
              <span>Cuisine</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {CUISINES.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCuisine(c)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCuisine === c
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/30'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Diets and Sort dropdown */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-stone-100">
            {/* Diet pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 mr-1 hidden sm:inline">
                Diet:
              </span>
              {DIETS.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDiet(d)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedDiet === d
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/80'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Sort & Reset */}
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-stone-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-stone-100 border-none text-xs font-semibold text-stone-700 py-1.5 px-3 rounded-xl focus:ring-2 focus:ring-orange-500 cursor-pointer"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="views">Most Viewed</option>
                  <option value="time">Quickest Cook Time</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>

              {(search || selectedCuisine !== 'All' || selectedDiet !== 'All' || sortBy !== 'rating') && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-orange-600 transition"
                  title="Reset all filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recipe Grid & Count */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900">Explore Recipes</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
              {totalCount} found
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-80 border border-stone-200" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 max-w-md mx-auto">
            <BookOpen className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-stone-800">No recipes matched your search</h3>
            <p className="text-stone-500 text-sm mt-1 mb-6">
              Try adjusting your keywords, cuisine filters, or diet preferences.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe._id}
                recipe={recipe}
                onCollectionClick={(rec) => setSelectedRecipeForCollection(rec)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Collection Modal */}
      <CollectionModal
        recipe={selectedRecipeForCollection}
        isOpen={Boolean(selectedRecipeForCollection)}
        onClose={() => setSelectedRecipeForCollection(null)}
      />
    </div>
  );
}
