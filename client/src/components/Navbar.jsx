import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  UtensilsCrossed,
  User,
  LogOut,
  Menu,
  X,
  Compass,
  ChefHat,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  Bookmark,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Navbar() {
  const { user, logout, settings, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/');
    } catch (err) {
      toast.error('Logout error');
    }
  };

  const handleQuickLogin = async (email, password, roleName) => {
    try {
      await login({ email, password });
      toast.success(`Switched role to ${roleName}!`);
      setRoleSwitcherOpen(false);
      setMobileMenuOpen(false);
      if (email === 'admin@platter.com') navigate('/admin');
      else if (email.includes('chef')) navigate('/contributor');
      else navigate('/explorer');
    } catch (err) {
      toast.error(err.message || 'Quick login failed.');
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'contributor') return '/contributor';
    return '/explorer';
  };

  const roleBadgeColors = {
    admin: 'bg-rose-100 text-rose-700 border-rose-200',
    contributor: 'bg-amber-100 text-amber-800 border-amber-200',
    explorer: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-stone-900 group-hover:text-orange-600 transition-colors">
                  {settings?.siteName || 'Platter'}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 -mt-1">
                  Recipe Platform
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  location.pathname === '/'
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                Browse Recipes
              </Link>

              {user && (
                <Link
                  to={getDashboardPath()}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 ${
                    location.pathname.startsWith('/admin') ||
                    location.pathname.startsWith('/contributor') ||
                    location.pathname.startsWith('/explorer')
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  {user.role === 'admin' && <ShieldCheck className="w-4 h-4 text-rose-600" />}
                  {user.role === 'contributor' && <ChefHat className="w-4 h-4 text-amber-600" />}
                  {user.role === 'explorer' && <Compass className="w-4 h-4 text-emerald-600" />}
                  {user.role === 'admin' && 'Admin Portal'}
                  {user.role === 'contributor' && 'Contributor Studio'}
                  {user.role === 'explorer' && 'Explorer Hub'}
                </Link>
              )}

              {user && user.role === 'contributor' && (
                <Link
                  to="/contributor?tab=share"
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-1 transition"
                >
                  <PlusCircle className="w-4 h-4" /> Share Recipe
                </Link>
              )}
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Demo Role Switcher Quick Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition border border-stone-200"
                title="Quickly switch demo accounts"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Demo Roles</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {roleSwitcherOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-2 z-50 animate-fade-in"
                  onMouseLeave={() => setRoleSwitcherOpen(false)}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-2 py-1">
                    Instant Demo Login
                  </div>
                  <button
                    onClick={() =>
                      handleQuickLogin('admin@platter.com', 'admin123', 'Admin Alex')
                    }
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-xs flex items-center justify-between transition"
                  >
                    <div>
                      <div className="font-bold text-stone-800">Admin Alex</div>
                      <div className="text-[11px] text-stone-500">Manage users & approvals</div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                      ADMIN
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      handleQuickLogin('chef.mario@platter.com', 'chef123', 'Chef Mario')
                    }
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 text-xs flex items-center justify-between transition"
                  >
                    <div>
                      <div className="font-bold text-stone-800">Chef Mario</div>
                      <div className="text-[11px] text-stone-500">Italian pasta & sourdough</div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                      CONTRIBUTOR
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      handleQuickLogin('chef.julia@platter.com', 'chef123', 'Chef Julia')
                    }
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-amber-50 text-xs flex items-center justify-between transition"
                  >
                    <div>
                      <div className="font-bold text-stone-800">Chef Julia</div>
                      <div className="text-[11px] text-stone-500">Asian fusion & bakery</div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                      CONTRIBUTOR
                    </span>
                  </button>

                  <button
                    onClick={() =>
                      handleQuickLogin('explorer.sam@platter.com', 'explorer123', 'Explorer Sam')
                    }
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-50 text-xs flex items-center justify-between transition"
                  >
                    <div>
                      <div className="font-bold text-stone-800">Explorer Sam</div>
                      <div className="text-[11px] text-stone-500">Ratings, reviews & collections</div>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      EXPLORER
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Authenticated user menu */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-stone-100 transition focus:outline-none"
                  aria-label="User menu"
                >
                  <img
                    src={
                      user.avatar ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-orange-500/30"
                  />
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-bold text-stone-900 leading-tight">
                      {user.name}
                    </div>
                    <span
                      className={`inline-block text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded border ${
                        roleBadgeColors[user.role]
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-1 z-50 animate-fade-in"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-stone-100">
                      <div className="text-xs font-bold text-stone-900">{user.name}</div>
                      <div className="text-[11px] text-stone-500 truncate">{user.email}</div>
                    </div>

                    <Link
                      to={getDashboardPath()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                    >
                      <User className="w-4 h-4 text-orange-600" />
                      Dashboard & Profile
                    </Link>

                    {user.role === 'explorer' && (
                      <Link
                        to="/explorer?tab=collections"
                        onClick={() => setUserDropdownOpen(false)}
                        className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                      >
                        <Bookmark className="w-4 h-4 text-emerald-600" />
                        My Collections
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-stone-100"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-50"
          >
            Browse Recipes
          </Link>

          {user && (
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              My Dashboard ({user.role})
            </Link>
          )}

          <div className="pt-2 border-t border-stone-100">
            <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
              Quick Role Switch:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleQuickLogin('admin@platter.com', 'admin123', 'Admin Alex')}
                className="p-2 bg-rose-50 text-rose-800 rounded font-semibold text-left"
              >
                Admin Alex
              </button>
              <button
                onClick={() => handleQuickLogin('chef.mario@platter.com', 'chef123', 'Chef Mario')}
                className="p-2 bg-amber-50 text-amber-800 rounded font-semibold text-left"
              >
                Chef Mario
              </button>
              <button
                onClick={() => handleQuickLogin('chef.julia@platter.com', 'chef123', 'Chef Julia')}
                className="p-2 bg-amber-50 text-amber-800 rounded font-semibold text-left"
              >
                Chef Julia
              </button>
              <button
                onClick={() => handleQuickLogin('explorer.sam@platter.com', 'explorer123', 'Explorer Sam')}
                className="p-2 bg-emerald-50 text-emerald-800 rounded font-semibold text-left"
              >
                Explorer Sam
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Log Out ({user.name})
              </button>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold bg-stone-100 text-stone-800 rounded-lg"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 text-sm font-semibold bg-orange-600 text-white rounded-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
