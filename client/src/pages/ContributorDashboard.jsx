import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ChefHat,
  PlusCircle,
  BarChart2,
  MessageSquare,
  User as UserIcon,
  Trash2,
  Edit2,
  Eye,
  Star,
  Send,
  Upload,
  Plus,
  X,
  ExternalLink,
  Clock,
  Users as UsersIcon,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const CUISINES = ['Italian', 'Asian', 'Mexican', 'French', 'Mediterranean', 'Bakery', 'American', 'Indian'];
const DIETS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Omnivore'];

export default function ContributorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'recipes';

  const { user, updateProfile, settings } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);

  // Recipes State
  const [myRecipes, setMyRecipes] = useState([]);
  const [editingRecipe, setEditingRecipe] = useState(null);

  // Recipe Form State (Create or Edit)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cuisine, setCuisine] = useState('Italian');
  const [diet, setDiet] = useState('Vegetarian');
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(20);
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState(['']);
  const [instructions, setInstructions] = useState(['']);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [submittingRecipe, setSubmittingRecipe] = useState(false);

  // Stats State
  const [statsData, setStatsData] = useState(null);

  // Messages State
  const [messages, setMessages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [profilePassword, setProfilePassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [recipesRes, statsRes, messagesRes, usersRes] = await Promise.all([
        api.getMyRecipes(),
        api.getContributorStats(),
        api.getMessages(),
        api.getUsers()
      ]);

      setMyRecipes(recipesRes.recipes || []);
      setStatsData(statsRes);
      setMessages(messagesRes.messages || []);
      setAllUsers(usersRes.users || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load contributor data.');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Tab Switch
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Recipe Form Ingredient helpers
  const handleAddIngredient = () => {
    if (ingredients.length >= (settings?.maxIngredients || 25)) {
      toast.error(`Maximum ingredients allowed is ${settings?.maxIngredients || 25}.`);
      return;
    }
    setIngredients([...ingredients, '']);
  };

  const handleRemoveIngredient = (index) => {
    if (ingredients.length <= 1) return;
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index, val) => {
    const copy = [...ingredients];
    copy[index] = val;
    setIngredients(copy);
  };

  // Recipe Form Instruction helpers
  const handleAddInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const handleRemoveInstruction = (index) => {
    if (instructions.length <= 1) return;
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleInstructionChange = (index, val) => {
    const copy = [...instructions];
    copy[index] = val;
    setInstructions(copy);
  };

  // Photo handling
  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Reset form
  const resetRecipeForm = () => {
    setTitle('');
    setDescription('');
    setCuisine('Italian');
    setDiet('Vegetarian');
    setPrepTime(15);
    setCookTime(20);
    setServings(4);
    setIngredients(['']);
    setInstructions(['']);
    setPhotoFile(null);
    setPhotoPreview('');
    setPhotoUrlInput('');
    setEditingRecipe(null);
  };

  // Populate form for editing
  const handleStartEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setTitle(recipe.title);
    setDescription(recipe.description);
    setCuisine(recipe.cuisine);
    setDiet(recipe.diet);
    setPrepTime(recipe.prepTime || 15);
    setCookTime(recipe.cookTime || 20);
    setServings(recipe.servings || 4);
    setIngredients(recipe.ingredients?.length ? recipe.ingredients : ['']);
    setInstructions(recipe.instructions?.length ? recipe.instructions : ['']);
    setPhotoPreview(recipe.photoUrl || '');
    setPhotoUrlInput(recipe.photoUrl || '');
    setActiveTab('share');
    setSearchParams({ tab: 'share' });
  };

  // Submit Recipe (Create or Update)
  const handleSubmitRecipe = async (e) => {
    e.preventDefault();

    const filteredIngredients = ingredients.map((i) => i.trim()).filter(Boolean);
    const filteredInstructions = instructions.map((i) => i.trim()).filter(Boolean);

    if (!title.trim() || !description.trim()) {
      toast.error('Please enter recipe title and description.');
      return;
    }

    if (filteredIngredients.length === 0) {
      toast.error('Please add at least one ingredient.');
      return;
    }

    if (filteredInstructions.length === 0) {
      toast.error('Please add at least one instruction step.');
      return;
    }

    if (filteredIngredients.length > (settings?.maxIngredients || 25)) {
      toast.error(`Exceeded max ingredients limit (${settings?.maxIngredients || 25}).`);
      return;
    }

    try {
      setSubmittingRecipe(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('cuisine', cuisine);
      formData.append('diet', diet);
      formData.append('prepTime', prepTime);
      formData.append('cookTime', cookTime);
      formData.append('servings', servings);
      formData.append('ingredients', JSON.stringify(filteredIngredients));
      formData.append('instructions', JSON.stringify(filteredInstructions));

      if (photoFile) {
        formData.append('photo', photoFile);
      } else if (photoUrlInput) {
        formData.append('photoUrl', photoUrlInput);
      }

      if (editingRecipe) {
        const res = await api.updateRecipe(editingRecipe._id, formData);
        toast.success(res.message || 'Recipe updated successfully!');
      } else {
        const res = await api.createRecipe(formData);
        toast.success(res.message || 'Recipe published successfully!');
      }

      resetRecipeForm();
      await loadData();
      setActiveTab('recipes');
      setSearchParams({ tab: 'recipes' });
    } catch (err) {
      toast.error(err.message || 'Failed to submit recipe.');
    } finally {
      setSubmittingRecipe(false);
    }
  };

  // Delete own recipe
  const handleDeleteRecipe = async (recipeId, recipeTitle) => {
    if (!window.confirm(`Are you sure you want to delete '${recipeTitle}'?`)) return;
    try {
      const res = await api.deleteRecipe(recipeId);
      toast.success(res.message || 'Recipe deleted successfully.');
      setMyRecipes((prev) => prev.filter((r) => r._id !== recipeId));
      const statsRes = await api.getContributorStats();
      setStatsData(statsRes);
    } catch (err) {
      toast.error(err.message || 'Failed to delete recipe.');
    }
  };

  // Send Direct Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedRecipientId) {
      toast.error('Please select a recipient.');
      return;
    }
    if (!messageContent.trim()) {
      toast.error('Please write a message.');
      return;
    }

    try {
      setSendingMsg(true);
      const res = await api.sendMessage({
        recipientId: selectedRecipientId,
        content: messageContent.trim()
      });
      toast.success(res.message || 'Message delivered successfully!');
      setMessageContent('');
      const updatedMessages = await api.getMessages();
      setMessages(updatedMessages.messages || []);
    } catch (err) {
      toast.error(err.message || 'Failed to send message.');
    } finally {
      setSendingMsg(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const updateData = {
        name: profileName.trim(),
        email: profileEmail.trim(),
        bio: profileBio.trim()
      };
      if (profilePassword) {
        updateData.password = profilePassword;
      }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-900 to-amber-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/30">
            <ChefHat className="w-3.5 h-3.5" /> Contributor Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Culinary Creator Hub
          </h1>
          <p className="text-amber-200 text-xs sm:text-sm mt-1">
            Publish dishes, track engagement and ratings, chat with the community, and manage your chef profile.
          </p>
        </div>

        {/* Quick summary stats */}
        {statsData?.summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-amber-200 font-bold uppercase">Recipes</span>
              <div className="text-xl font-extrabold text-white">
                {statsData.summary.totalRecipes}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-amber-200 font-bold uppercase">Views</span>
              <div className="text-xl font-extrabold text-white">
                {statsData.summary.totalViews}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-amber-200 font-bold uppercase">Reviews</span>
              <div className="text-xl font-extrabold text-white">
                {statsData.summary.totalReviews}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-amber-200 font-bold uppercase">Avg Rating</span>
              <div className="text-xl font-extrabold text-white">
                {statsData.summary.averageRating}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => handleTabChange('recipes')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'recipes'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>My Recipes</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
            {myRecipes.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('share')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'share'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{editingRecipe ? 'Edit Recipe' : 'Share New Recipe'}</span>
        </button>

        <button
          onClick={() => handleTabChange('stats')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'stats'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Recipe Stats</span>
        </button>

        <button
          onClick={() => handleTabChange('messages')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'messages'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Interaction History</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
            {messages.length}
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
          <span>Profile Details</span>
        </button>
      </div>

      {/* Tab 1: My Recipes Management Table */}
      {activeTab === 'recipes' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Your Published & Pending Recipes</h2>
            <button
              onClick={() => {
                resetRecipeForm();
                handleTabChange('share');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Share Recipe
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] font-bold border-b border-stone-200">
                  <tr>
                    <th className="py-3.5 px-4">Recipe</th>
                    <th className="py-3.5 px-4">Cuisine / Diet</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Views</th>
                    <th className="py-3.5 px-4">Rating</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {myRecipes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-400">
                        You have not created any recipes yet.{' '}
                        <button
                          onClick={() => handleTabChange('share')}
                          className="text-orange-600 font-bold underline ml-1"
                        >
                          Share your first recipe!
                        </button>
                      </td>
                    </tr>
                  ) : (
                    myRecipes.map((r) => (
                      <tr key={r._id} className="hover:bg-stone-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                r.photoUrl ||
                                'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=100&q=80'
                              }
                              alt={r.title}
                              className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                            <div>
                              <Link
                                to={`/recipes/${r._id}`}
                                className="font-bold text-stone-900 hover:text-orange-600 flex items-center gap-1"
                              >
                                {r.title}
                                <ExternalLink className="w-3 h-3 text-stone-400" />
                              </Link>
                              <div className="text-[11px] text-stone-400">
                                {r.ingredients?.length || 0} ingredients &bull; {r.totalTime || 30} mins
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-stone-100 text-stone-700">
                              {r.cuisine}
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-orange-100 text-orange-800">
                              {r.diet}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide ${
                              r.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-stone-700">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-stone-400" />
                            {r.viewCount || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="flex items-center gap-1 font-bold text-stone-900">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            {Number(r.averageRating || 0).toFixed(1)}
                            <span className="text-[11px] font-normal text-stone-400">
                              ({r.reviewCount || 0})
                            </span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartEditRecipe(r)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                              title="Edit Recipe"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecipe(r._id, r.title)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Recipe"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Tab 2: Recipe Sharing / Editing Form */}
      {activeTab === 'share' && (
        <section className="max-w-3xl bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900">
                {editingRecipe ? `Editing: ${editingRecipe.title}` : 'Share a New Recipe'}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                {settings?.requireApproval
                  ? 'Note: Submitted recipes will be reviewed by admin moderators before appearing publicly.'
                  : 'Submitted recipes will be published immediately to all explorers.'}
              </p>
            </div>
            {editingRecipe && (
              <button
                type="button"
                onClick={resetRecipeForm}
                className="text-xs font-semibold text-stone-500 hover:text-stone-800"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitRecipe} className="space-y-6">
            {/* Title & Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Recipe Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Handmade Tagliatelle with Truffle Butter"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Recipe Description & Culinary Story *
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe flavors, origins, key techniques, or what makes this dish special..."
                className="w-full text-sm p-3.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Cuisine & Diet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Cuisine *
                </label>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {CUISINES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Diet Category *
                </label>
                <select
                  value={diet}
                  onChange={(e) => setDiet(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  {DIETS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prep Time, Cook Time, Servings */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Prep (mins)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Cook (mins)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={cookTime}
                  onChange={(e) => setCookTime(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Servings
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Ingredients Dynamic List */}
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Ingredients ({ingredients.length} / max {settings?.maxIngredients || 25}) *
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Include quantities (e.g. 500g flour, 2 tbsp olive oil)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>

              <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-400 w-5">{idx + 1}.</span>
                    <input
                      type="text"
                      required
                      value={ing}
                      onChange={(e) => handleIngredientChange(idx, e.target.value)}
                      placeholder="e.g. 2 cloves garlic, finely grated"
                      className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(idx)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Instructions Dynamic List */}
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Step-by-Step Instructions *
                  </label>
                  <span className="text-[11px] text-stone-400">
                    Detailed directions for executing this recipe
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddInstruction}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              </div>

              <div className="space-y-2">
                {instructions.map((ins, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-xs font-bold text-stone-400 w-5 pt-2.5">
                      {idx + 1}.
                    </span>
                    <textarea
                      rows={2}
                      required
                      value={ins}
                      onChange={(e) => handleInstructionChange(idx, e.target.value)}
                      placeholder={`Step ${idx + 1} directions...`}
                      className="flex-1 text-xs sm:text-sm p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInstruction(idx)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition mt-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Photo Upload with Multer local file upload or fallback URL */}
            <div className="space-y-3 pt-3 border-t border-stone-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                Recipe Food Photo
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-stone-500 mb-1">
                    Upload Local File (Multer):
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileChange}
                    className="w-full text-xs text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-500 mb-1">
                    Or Enter Image URL:
                  </label>
                  <input
                    type="url"
                    value={photoUrlInput}
                    onChange={(e) => {
                      setPhotoUrlInput(e.target.value);
                      if (!photoFile) setPhotoPreview(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {photoPreview && (
                <div className="mt-2 relative w-48 h-32 rounded-xl overflow-hidden border border-stone-200">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview('');
                      setPhotoUrlInput('');
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={submittingRecipe}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                {submittingRecipe
                  ? 'Saving Recipe...'
                  : editingRecipe
                  ? 'Update Recipe'
                  : 'Submit Recipe for Approval'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tab 3: Recipe Stats (Recharts) */}
      {activeTab === 'stats' && (
        <section className="space-y-6">
          <div className="border-b border-stone-100 pb-3">
            <h2 className="text-xl font-bold text-stone-900">Recipe Performance & Analytics</h2>
            <p className="text-xs text-stone-500 mt-1">
              Real-time graphs of view counts, star ratings, and community reviews across your dishes.
            </p>
          </div>

          {!statsData?.chartData || statsData.chartData.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center text-stone-400 text-sm">
              No recipe stats yet. Publish a recipe to see engagement graphs!
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Views per recipe */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Views per Recipe</h3>
                    <p className="text-xs text-stone-400">Total recipe page visits</p>
                  </div>
                  <Eye className="w-5 h-5 text-orange-600" />
                </div>
                <div className="h-64 sm:h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="views" fill="#f97316" radius={[6, 6, 0, 0]} name="Views" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Ratings per recipe */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Average Star Ratings</h3>
                    <p className="text-xs text-stone-400">1 to 5 stars community score</p>
                  </div>
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
                <div className="h-64 sm:h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis domain={[0, 5]} stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="rating" fill="#eab308" radius={[6, 6, 0, 0]} name="Rating (1-5)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Reviews count */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">Community Reviews</h3>
                    <p className="text-xs text-stone-400">Number of feedback reviews received</p>
                  </div>
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="h-64 sm:h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="reviews" fill="#10b981" radius={[6, 6, 0, 0]} name="Reviews" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Tab 4: Messages / Interaction History */}
      {activeTab === 'messages' && (
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Interaction History</h2>
              <p className="text-xs text-stone-500 mt-1">
                Direct messages sent and received with other cooks and explorers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compose Message Box */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-orange-600" /> Send Message
              </h3>

              <form onSubmit={handleSendMessage} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Select User to Message *
                  </label>
                  <select
                    required
                    value={selectedRecipientId}
                    onChange={(e) => setSelectedRecipientId(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                  >
                    <option value="">-- Choose User --</option>
                    {allUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Message Content *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Share recipe tips, collaboration proposals, or culinary feedback..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingMsg}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {sendingMsg ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Conversation Feed */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-stone-900">Message Feed</h3>

              {messages.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-xs sm:text-sm">
                  No message history found. Start a conversation using the form on the left!
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => {
                    const isSender =
                      (typeof m.sender === 'string' ? m.sender : m.sender?._id) === user?._id;
                    const otherParty = isSender ? m.recipient : m.sender;

                    return (
                      <div
                        key={m._id}
                        className={`p-4 rounded-2xl border transition ${
                          isSender
                            ? 'bg-orange-50/50 border-orange-200 ml-4 sm:ml-8'
                            : 'bg-stone-50 border-stone-200 mr-4 sm:mr-8'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900">
                              {isSender ? 'You' : otherParty?.name || 'User'}
                            </span>
                            <span className="text-stone-400 text-[11px]">
                              {isSender
                                ? `to ${otherParty?.name || 'User'}`
                                : 'sent to you'}
                            </span>
                            {m.recipe?.title && (
                              <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-stone-200 font-semibold text-stone-600">
                                Re: {m.recipe.title}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-stone-400">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}{' '}
                            &bull; {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-stone-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                          {m.content}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Tab 5: Profile Management */}
      {activeTab === 'profile' && (
        <section className="max-w-xl bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs">
          <div className="border-b border-stone-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-stone-900">Profile & Bio</h2>
            <p className="text-xs text-stone-500 mt-1">
              Update your culinary biography, display name, and login credentials.
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Display Name *
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
                Chef Bio / Specialities
              </label>
              <textarea
                rows={3}
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                placeholder="Share your culinary background, awards, favorite cuisines..."
                className="w-full text-sm p-3.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Change Password (leave blank to keep current)
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

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
