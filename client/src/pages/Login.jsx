import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UtensilsCrossed, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await login({ email, password });
      toast.success(res.message || 'Logged in successfully!');

      if (from !== '/') {
        navigate(from, { replace: true });
      } else if (res.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (res.user?.role === 'contributor') {
        navigate('/contributor', { replace: true });
      } else {
        navigate('/explorer', { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Sign in to Platter
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-stone-500">
            Welcome back! Enter your details or select a demo role below.
          </p>
        </div>

        {/* Demo Roles Quick Click Cards */}
        <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Demo Credentials:
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoAccount('admin@platter.com', 'admin123')}
              className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/80 text-rose-900 text-left transition"
            >
              <div className="font-bold">Admin Alex</div>
              <div className="text-[11px] text-rose-600 font-mono">admin@platter.com</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('chef.mario@platter.com', 'chef123')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 text-left transition"
            >
              <div className="font-bold">Chef Mario</div>
              <div className="text-[11px] text-amber-700 font-mono">chef.mario@...</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('chef.julia@platter.com', 'chef123')}
              className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-amber-900 text-left transition"
            >
              <div className="font-bold">Chef Julia</div>
              <div className="text-[11px] text-amber-700 font-mono">chef.julia@...</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoAccount('explorer.sam@platter.com', 'explorer123')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-900 text-left transition"
            >
              <div className="font-bold">Explorer Sam</div>
              <div className="text-[11px] text-emerald-700 font-mono">explorer.sam@...</div>
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/80 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. chef.mario@platter.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-xl shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-stone-500">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
