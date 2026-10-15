import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Lock, Mail, User, Compass, ChefHat, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('explorer');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        bio: bio.trim()
      });

      toast.success(res.message || 'Account created successfully!');
      if (role === 'contributor') {
        navigate('/contributor');
      } else {
        navigate('/explorer');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Join the Platter Community
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-500">
            Select your culinary journey to get started.
          </p>
        </div>

        {/* Role Choice Radio Cards */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('explorer')}
            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
              role === 'explorer'
                ? 'border-emerald-500 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20'
                : 'border-stone-200 bg-white hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              {role === 'explorer' && (
                <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">Recipe Explorer</h3>
              <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                Browse dishes, rate & review recipes, curate personal collections.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setRole('contributor')}
            className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
              role === 'contributor'
                ? 'border-amber-500 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/20'
                : 'border-stone-200 bg-white hover:bg-stone-50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <ChefHat className="w-4 h-4" />
              </div>
              {role === 'contributor' && (
                <span className="text-[10px] font-bold uppercase bg-amber-600 text-white px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">Recipe Contributor</h3>
              <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                Publish signature recipes, inspect stats, message fellow food lovers.
              </p>
            </div>
          </button>
        </div>

        {/* Registration Card Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maya Patel"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maya@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password * (min. 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Short Bio (optional)
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What kinds of foods do you love cooking or exploring?"
                className="w-full p-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Creating your account...'
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-orange-600 hover:text-orange-700">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
