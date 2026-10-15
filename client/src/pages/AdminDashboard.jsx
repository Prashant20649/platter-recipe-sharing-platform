import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  Settings as SettingsIcon,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  Plus,
  Save,
  Search,
  ExternalLink,
  AlertTriangle,
  Star
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AdminDashboard() {
  const { user, refreshSettings } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState(null);

  // Users Management State
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'explorer',
    bio: ''
  });

  // Recipes Management State
  const [recipes, setRecipes] = useState([]);
  const [recipeStatusFilter, setRecipeStatusFilter] = useState('all');

  // System Settings State
  const [settingsForm, setSettingsForm] = useState({
    siteName: 'Platter',
    requireApproval: true,
    allowReviews: true,
    maxIngredients: 25,
    maintenanceMode: false
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Content Moderation Reviews State
  const [reviews, setReviews] = useState([]);

  // Fetch data based on tab or initial load
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, usersData, recipesData, settingsData, reviewsData] =
        await Promise.all([
          api.getAdminStats(),
          api.getUsers(),
          api.getAdminRecipes({ status: recipeStatusFilter }),
          api.getAdminSettings(),
          api.getAllReviewsAdmin()
        ]);

      setStats(statsData);
      setUsers(usersData.users || []);
      setRecipes(recipesData.recipes || []);
      if (settingsData.settings) {
        setSettingsForm({
          siteName: settingsData.settings.siteName || 'Platter',
          requireApproval: Boolean(settingsData.settings.requireApproval),
          allowReviews: Boolean(settingsData.settings.allowReviews),
          maxIngredients: settingsData.settings.maxIngredients || 25,
          maintenanceMode: Boolean(settingsData.settings.maintenanceMode)
        });
      }
      setReviews(reviewsData.reviews || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, [recipeStatusFilter, toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle Recipe Status Filter change
  const handleRecipeFilterChange = async (newStatus) => {
    setRecipeStatusFilter(newStatus);
    try {
      const data = await api.getAdminRecipes({ status: newStatus });
      setRecipes(data.recipes || []);
    } catch (err) {
      toast.error('Failed to filter recipes.');
    }
  };

  // User Management Actions
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createUser(userFormData);
      toast.success(res.message);
      setShowCreateUserModal(false);
      setUserFormData({ name: '', email: '', password: '', role: 'explorer', bio: '' });
      const updated = await api.getUsers();
      setUsers(updated.users || []);
    } catch (err) {
      toast.error(err.message || 'Could not create user.');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await api.updateUser(editingUser._id, userFormData);
      toast.success(res.message);
      setEditingUser(null);
      const updated = await api.getUsers();
      setUsers(updated.users || []);
    } catch (err) {
      toast.error(err.message || 'Could not update user.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to delete user '${targetUser.name}'?`)) return;
    try {
      const res = await api.deleteUser(targetUser._id);
      toast.success(res.message);
      const updated = await api.getUsers();
      setUsers(updated.users || []);
    } catch (err) {
      toast.error(err.message || 'Could not delete user.');
    }
  };

  const openEditUser = (u) => {
    setEditingUser(u);
    setUserFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      bio: u.bio || '',
      password: ''
    });
  };

  // Recipe Approval & Moderation Actions
  const handleRecipeApproval = async (recipeId, newStatus) => {
    try {
      const res = await api.updateRecipeApproval(recipeId, newStatus);
      toast.success(res.message);
      setRecipes((prev) =>
        prev.map((r) => (r._id === recipeId ? { ...r, status: newStatus } : r))
      );
      // Refresh stats
      const statsData = await api.getAdminStats();
      setStats(statsData);
    } catch (err) {
      toast.error(err.message || 'Failed to update recipe status.');
    }
  };

  const handleDeleteRecipe = async (recipeId, title) => {
    if (!window.confirm(`Delete recipe '${title}' permanently?`)) return;
    try {
      const res = await api.deleteRecipe(recipeId);
      toast.success(res.message);
      setRecipes((prev) => prev.filter((r) => r._id !== recipeId));
      const statsData = await api.getAdminStats();
      setStats(statsData);
    } catch (err) {
      toast.error(err.message || 'Failed to delete recipe.');
    }
  };

  // System Settings Action
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await api.updateSettings(settingsForm);
      toast.success(res.message || 'System settings saved successfully!');
      await refreshSettings();
    } catch (err) {
      toast.error(err.message || 'Failed to save system settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Content Moderation (Reviews) Action
  const handleRemoveReview = async (reviewId) => {
    if (!window.confirm('Remove this review from the platform?')) return;
    try {
      const res = await api.deleteReview(reviewId);
      toast.success(res.message || 'Review removed.');
      setReviews((prev) => prev.filter((r) => r._id !== reviewId));
      const statsData = await api.getAdminStats();
      setStats(statsData);
    } catch (err) {
      toast.error(err.message || 'Failed to remove review.');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white p-6 sm:p-8 rounded-3xl shadow-lg">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2 border border-rose-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrator Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            System Control & Moderation
          </h1>
          <p className="text-stone-400 text-xs sm:text-sm mt-1">
            Manage users, review and approve incoming recipes, monitor content, and configure platform settings.
          </p>
        </div>

        {/* Global summary stats pill cards */}
        {stats?.overview && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-stone-300 font-bold uppercase">Users</span>
              <div className="text-xl font-extrabold text-white">{stats.overview.users}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-stone-300 font-bold uppercase">Recipes</span>
              <div className="text-xl font-extrabold text-white">{stats.overview.recipes}</div>
            </div>
            <div className="bg-amber-500/20 backdrop-blur-md p-3 rounded-2xl border border-amber-500/30">
              <span className="text-[10px] text-amber-300 font-bold uppercase">Pending</span>
              <div className="text-xl font-extrabold text-amber-300">
                {stats.overview.pendingRecipes}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-[10px] text-stone-300 font-bold uppercase">Reviews</span>
              <div className="text-xl font-extrabold text-white">{stats.overview.reviews}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'recipes'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Recipe Approval</span>
          {stats?.overview?.pendingRecipes > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold animate-pulse">
              {stats.overview.pendingRecipes} pending
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>System Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'reviews'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-stone-600 hover:text-stone-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Content Moderation</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
            {reviews.length}
          </span>
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search user by name, email, or role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
              />
            </div>

            <button
              onClick={() => {
                setUserFormData({ name: '', email: '', password: '', role: 'explorer', bio: '' });
                setShowCreateUserModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Create New User
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] font-bold border-b border-stone-200">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Joined</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        No users found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-stone-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                u.avatar ||
                                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
                              }
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-200"
                            />
                            <div>
                              <div className="font-bold text-stone-900">{u.name}</div>
                              {u._id === user._id && (
                                <span className="text-[10px] text-stone-400">(You)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-stone-600">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                              u.role === 'admin'
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : u.role === 'contributor'
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-stone-500">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openEditUser(u)}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition"
                              title="Edit user details and role"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {u._id !== user._id && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
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

      {/* Tab 2: Recipe Approval & Management */}
      {activeTab === 'recipes' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Filter Status:
              </span>
              {['all', 'pending', 'approved', 'rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => handleRecipeFilterChange(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                    recipeStatusFilter === st
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <span className="text-xs text-stone-500 font-medium">
              Showing {recipes.length} recipes
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[11px] font-bold border-b border-stone-200">
                  <tr>
                    <th className="py-3.5 px-4">Recipe Title</th>
                    <th className="py-3.5 px-4">Author</th>
                    <th className="py-3.5 px-4">Cuisine / Diet</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {recipes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-stone-400">
                        No recipes found with status '{recipeStatusFilter}'.
                      </td>
                    </tr>
                  ) : (
                    recipes.map((r) => (
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
                          <span className="font-semibold text-stone-800">
                            {r.author?.name || 'Chef'}
                          </span>
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
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {r.status !== 'approved' && (
                              <button
                                onClick={() => handleRecipeApproval(r._id, 'approved')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                                title="Approve recipe for public browsing"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Approve
                              </button>
                            )}

                            {r.status !== 'rejected' && (
                              <button
                                onClick={() => handleRecipeApproval(r._id, 'rejected')}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-200 hover:bg-rose-100 hover:text-rose-700 text-stone-700 text-xs font-semibold transition"
                                title="Reject recipe"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Reject
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteRecipe(r._id, r.title)}
                              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete recipe permanently"
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

      {/* Tab 3: System Settings */}
      {activeTab === 'settings' && (
        <section className="max-w-2xl bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-xs">
          <div className="border-b border-stone-100 pb-4 mb-6">
            <h2 className="text-xl font-bold text-stone-900">Platform Settings</h2>
            <p className="text-xs text-stone-500 mt-1">
              Configure global application rules, content constraints, and operational toggles.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Site Name
              </label>
              <input
                type="text"
                required
                value={settingsForm.siteName}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, siteName: e.target.value })
                }
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Brand title shown in the header, footer, and notifications.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                Max Ingredients per Recipe
              </label>
              <input
                type="number"
                min={3}
                max={100}
                required
                value={settingsForm.maxIngredients}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    maxIngredients: Number(e.target.value)
                  })
                }
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                Enforced on recipe submission to prevent overly bloated recipes (3 - 100).
              </span>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
                <div>
                  <div className="font-bold text-sm text-stone-900">
                    Require Admin Approval for New Recipes
                  </div>
                  <div className="text-xs text-stone-500">
                    When active, new contributor recipes start as 'pending' until approved.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.requireApproval}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, requireApproval: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-stone-200 hover:bg-stone-50 cursor-pointer transition">
                <div>
                  <div className="font-bold text-sm text-stone-900">
                    Allow Community Reviews
                  </div>
                  <div className="text-xs text-stone-500">
                    Allow registered users to rate recipes from 1 to 5 stars and post reviews.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.allowReviews}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, allowReviews: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 cursor-pointer transition">
                <div>
                  <div className="font-bold text-sm text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Maintenance Mode
                  </div>
                  <div className="text-xs text-rose-700">
                    Restrict public & regular user access while system updates or maintenance are performed.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.maintenanceMode}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, maintenanceMode: e.target.checked })
                  }
                  className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </label>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tab 4: Content Moderation */}
      {activeTab === 'reviews' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Moderation Feed</h2>
            <span className="text-xs text-stone-500">{reviews.length} reviews published</span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs divide-y divide-stone-100">
            {reviews.length === 0 ? (
              <div className="py-12 text-center text-stone-400 text-sm">
                No reviews found to moderate.
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-stone-50/50 transition"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">
                        {rev.user?.name || 'Explorer'}
                      </span>
                      <span className="text-xs text-stone-400">({rev.user?.email})</span>
                      <span className="text-stone-300">&bull;</span>
                      <span className="text-xs text-stone-500">
                        on recipe:{' '}
                        <strong className="text-stone-800">{rev.recipe?.title || 'Dish'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <div className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < rev.rating ? 'fill-amber-400' : 'text-stone-300 fill-transparent'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-stone-700">{rev.rating} / 5</span>
                      <span className="text-[11px] text-stone-400">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-stone-700 text-xs sm:text-sm bg-stone-50 p-3 rounded-xl border border-stone-100">
                      "{rev.comment}"
                    </p>
                  </div>

                  <div className="shrink-0 flex sm:flex-col items-center justify-end gap-2">
                    <button
                      onClick={() => handleRemoveReview(rev._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition"
                      title="Remove review"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* User Create / Edit Modal */}
      {(showCreateUserModal || editingUser) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-base">
                {editingUser ? `Edit User: ${editingUser.name}` : 'Create New User'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateUserModal(false);
                  setEditingUser(null);
                }}
                className="text-stone-400 hover:text-stone-700 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, name: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, email: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {editingUser ? 'Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  minLength={6}
                  value={userFormData.password}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, password: e.target.value })
                  }
                  placeholder={editingUser ? '••••••••' : 'Password'}
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  User Role *
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, role: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="explorer">Explorer (browse, rate, review, collections)</option>
                  <option value="contributor">Contributor (share recipes, stats, message)</option>
                  <option value="admin">Administrator (full system access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Bio (optional)
                </label>
                <textarea
                  rows={2}
                  value={userFormData.bio}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, bio: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateUserModal(false);
                    setEditingUser(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
