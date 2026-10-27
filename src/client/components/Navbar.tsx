import React from 'react';
import {
  MapPin,
  Search,
  PlusCircle,
  ShieldCheck,
  Sun,
  Moon,
  User,
  LogOut,
  Sparkles,
  MessageSquarePlus,
  Users,
} from 'lucide-react';
import { SW_IOWA_TOWNS } from '../../db/constants';
import type { UserProfile } from '../types';

interface NavbarProps {
  selectedTown: string;
  onSelectTown: (town: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreate: () => void;
  onOpenDashboard: () => void;
  onOpenAdminUsers?: () => void;
  onOpenAuth: () => void;
  onOpenPricing: () => void;
  onOpenSuggestion: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedTown,
  onSelectTown,
  searchQuery,
  onSearchChange,
  onOpenCreate,
  onOpenDashboard,
  onOpenAdminUsers,
  onOpenAuth,
  onOpenPricing,
  onOpenSuggestion,
  currentUser,
  onLogout,
  isDarkMode,
  onToggleTheme,
}) => {
  const isPro = currentUser?.tier === 'pro_monthly' || currentUser?.tier === 'pro_annual';
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Region */}
          <div
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => onSelectTown('')}
          >
            <div className="w-10 h-10 rounded-xl bg-prairie-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
              IA
            </div>
            <div className="hidden xs:block">
              <h1 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                Southwest Iowa
              </h1>
              <p className="text-[11px] text-prairie-700 dark:text-prairie-400 font-semibold">
                Community Central
              </p>
            </div>
          </div>

          {/* Sticky Local Town Dropdown */}
          <div className="relative flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 min-h-[44px] hover:border-prairie-500 transition-colors">
              <MapPin className="w-4 h-4 text-prairie-600 dark:text-prairie-400 flex-shrink-0" />
              <select
                aria-label="Select Southwest Iowa Town"
                value={selectedTown}
                onChange={(e) => onSelectTown(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-1"
              >
                <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  All Southwest Iowa
                </option>
                {SW_IOWA_TOWNS.map((town) => (
                  <option key={town} value={town} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {town}, IA
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar on desktop */}
          <div className="hidden md:flex flex-1 max-w-sm relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search rentals, contractors, events..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-prairie-500 min-h-[44px]"
            />
          </div>

          {/* Actions: Theme Toggle + Suggest + Post + User Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={onToggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Suggest a Business (Community Crowdsourcing) */}
            <button
              onClick={onOpenSuggestion}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] transition-colors"
              title="Suggest a local business or contractor"
            >
              <MessageSquarePlus className="w-4 h-4 text-prairie-600 dark:text-prairie-400" />
              <span>Suggest</span>
            </button>

            {/* Pricing / Pro Upgrade Button */}
            <button
              onClick={onOpenPricing}
              className={`hidden sm:flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] border ${
                isPro
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                  : 'bg-prairie-50 dark:bg-prairie-950/40 border-prairie-300 dark:border-prairie-700 text-prairie-700 dark:text-prairie-300 hover:bg-prairie-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isPro ? 'Pro Active' : 'Upgrade $10/mo'}</span>
            </button>

            {/* Dashboard (if logged in) */}
            {currentUser && (
              <button
                onClick={onOpenDashboard}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-prairie-600" />
                <span>Dashboard</span>
              </button>
            )}

            {/* Admin User Management Button */}
            {isAdmin && onOpenAdminUsers && (
              <button
                onClick={onOpenAdminUsers}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 min-h-[44px] transition-colors shadow-sm"
                title="Manage users, reset passwords & grant Pro testing licenses"
              >
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Manage Users</span>
              </button>
            )}

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 min-h-[44px]">
                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[90px] sm:max-w-[120px]">
                      {currentUser.name}
                    </span>
                    {isAdmin && (
                      <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-[9px] font-black px-1.5 py-0.2 rounded">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                    {isPro ? '⭐ Pro Plan' : 'Free Member'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 ml-1 rounded"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] transition-colors"
              >
                <User className="w-4 h-4 text-prairie-600" />
                <span>Sign In</span>
              </button>
            )}

            {/* Post Listing CTA */}
            <button
              onClick={onOpenCreate}
              className="bg-prairie-600 hover:bg-prairie-500 text-white font-bold px-3 sm:px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 min-h-[44px] shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Post Listing</span>
              <span className="sm:hidden">Post</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="mt-2 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Creston, Corning rentals, services..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-prairie-500 min-h-[44px]"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
