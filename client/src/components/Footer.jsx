import React from 'react';
import { UtensilsCrossed, Heart, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { settings } = useAuth();

  return (
    <footer className="mt-auto bg-stone-900 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                {settings?.siteName || 'Platter'}
              </span>
            </div>
            <p className="text-stone-400 text-sm max-w-sm leading-relaxed">
              A vibrant community connecting passionate culinary creators and food explorers.
              Discover, rate, review, and curate hand-crafted recipes from around the world.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <a href="/" className="hover:text-orange-400 transition">Browse Recipes</a>
              </li>
              <li>
                <a href="/login" className="hover:text-orange-400 transition">Account Sign In</a>
              </li>
              <li>
                <a href="/register" className="hover:text-orange-400 transition">Join Community</a>
              </li>
            </ul>
          </div>

          {/* Seed accounts helper */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Demo Logins
            </h4>
            <div className="space-y-1.5 text-xs text-stone-400">
              <div>
                <span className="text-rose-400 font-semibold">Admin:</span> admin@platter.com
              </div>
              <div>
                <span className="text-amber-400 font-semibold">Contributor:</span> chef.mario@platter.com
              </div>
              <div>
                <span className="text-emerald-400 font-semibold">Explorer:</span> explorer.sam@platter.com
              </div>
              <div className="text-[11px] text-stone-500 pt-1">
                Password: <code>admin123</code> / <code>chef123</code> / <code>explorer123</code>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <div>
            &copy; {new Date().getFullYear()} {settings?.siteName || 'Platter'}. Full-Stack Recipe Platform.
          </div>
          <div className="flex items-center gap-1">
            Built with React, Vite, Tailwind CSS, Express, MongoDB & Recharts.
          </div>
        </div>
      </div>
    </footer>
  );
}
