import React from 'react';
import {
  Snowflake,
  Wrench,
  Truck,
  Flame,
  Home,
  Calendar,
  Sparkles,
  SlidersHorizontal,
  X,
  MapPin,
  MessageSquarePlus,
} from 'lucide-react';
import type { Listing, ListingFilter } from '../types';
import { ListingCard } from '../components/ListingCard';
import { SW_IOWA_TOWNS } from '../../db/constants';

interface HomeFeedProps {
  listings: Listing[];
  filters: ListingFilter;
  onFilterChange: (filters: ListingFilter) => void;
  onSelectListing: (listing: Listing) => void;
  onOpenCreate: () => void;
  onOpenSuggestion: () => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  listings,
  filters,
  onFilterChange,
  onSelectListing,
  onOpenCreate,
  onOpenSuggestion,
}) => {
  // Emergency quick-filters
  const handleEmergencyFilter = (categorySlug: string, emergency = true) => {
    onFilterChange({
      ...filters,
      categoryType: 'service',
      emergencyAvailable: emergency,
      q: categorySlug,
    });
  };

  const activeCategory = filters.categoryType || '';

  const filteredListings = listings.filter((item) => {
    if (filters.categoryType && item.categoryType !== filters.categoryType) {
      return false;
    }
    if (filters.town && item.town !== filters.town) {
      return false;
    }
    if (filters.emergencyAvailable && !item.emergencyAvailable) {
      return false;
    }
    if (filters.petsAllowed && !item.petsAllowed) {
      return false;
    }
    if (filters.bedrooms && (item.bedrooms === null || item.bedrooms === undefined || item.bedrooms < filters.bedrooms)) {
      return false;
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchTown = item.town.toLowerCase().includes(q);
      const matchOfferings = item.serviceOfferings?.some((s) => s.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchTown && !matchOfferings) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 pb-24 text-slate-800 dark:text-slate-100">
      {/* Emergency Service Quick Action Banner */}
      <section className="mb-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-700/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-200">
              Immediate Local Assistance (Southwest Iowa)
            </h2>
          </div>
          {filters.emergencyAvailable && (
            <button
              onClick={() => onFilterChange({ ...filters, emergencyAvailable: undefined, q: undefined })}
              className="text-[11px] text-prairie-300 hover:text-white flex items-center gap-1 min-h-[36px]"
            >
              <X className="w-3.5 h-3.5" /> Clear Emergency Filter
            </button>
          )}
        </div>

        {/* Emergency Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => handleEmergencyFilter('snow', true)}
            className="flex-shrink-0 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/50 text-cyan-200 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 min-h-[44px] transition-all shadow-sm"
          >
            <Snowflake className="w-4 h-4 text-cyan-400" />
            <span>Snow Removal Now</span>
          </button>

          <button
            onClick={() => handleEmergencyFilter('plumb', true)}
            className="flex-shrink-0 bg-blue-950/80 hover:bg-blue-900 border border-blue-600/50 text-blue-200 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 min-h-[44px] transition-all shadow-sm"
          >
            <Wrench className="w-4 h-4 text-blue-400" />
            <span>Plumbing / Frozen Pipes</span>
          </button>

          <button
            onClick={() => handleEmergencyFilter('furnace', true)}
            className="flex-shrink-0 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/50 text-amber-200 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 min-h-[44px] transition-all shadow-sm"
          >
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Furnace / Heating Repair</span>
          </button>

          <button
            onClick={() => handleEmergencyFilter('hauling', true)}
            className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 min-h-[44px] transition-all shadow-sm"
          >
            <Truck className="w-4 h-4 text-slate-400" />
            <span>Hauling & Towing</span>
          </button>
        </div>
      </section>

      {/* Main Grid: Filters Sidebar (Desktop) + Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1 space-y-5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 h-fit sticky top-20 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/60">
            <span className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-prairie-600" />
              Filter Listings
            </span>
            <button
              onClick={() => onFilterChange({})}
              className="text-xs font-semibold text-prairie-600 dark:text-prairie-400 hover:underline min-h-[36px]"
            >
              Reset
            </button>
          </div>

          {/* Category Type */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Directory Category
            </label>
            <div className="space-y-1">
              {[
                { id: '', label: 'All Listings' },
                { id: 'rental', label: 'Rentals & Apartments' },
                { id: 'service', label: 'Local Contractors' },
                { id: 'event', label: 'Community Events' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => onFilterChange({ ...filters, categoryType: c.id as any })}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between min-h-[40px] transition-colors ${
                    activeCategory === c.id
                      ? 'bg-prairie-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <span>{c.label}</span>
                  <span className="text-[11px] opacity-70">
                    {listings.filter((l) => (c.id ? l.categoryType === c.id : true)).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Town Selection */}
          <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Town
            </label>
            <select
              value={filters.town || ''}
              onChange={(e) => onFilterChange({ ...filters, town: e.target.value || undefined })}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white font-medium min-h-[44px]"
            >
              <option value="">All Southwest Iowa</option>
              {SW_IOWA_TOWNS.map((t) => (
                <option key={t} value={t}>
                  {t}, IA
                </option>
              ))}
            </select>
          </div>

          {/* Rental Filters */}
          {(!activeCategory || activeCategory === 'rental') && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-3">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Rental Preferences
              </label>

              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">Minimum Bedrooms</span>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 1, 2, 3].map((b) => (
                    <button
                      key={b}
                      onClick={() => onFilterChange({ ...filters, bedrooms: b === 0 ? undefined : b })}
                      className={`py-1.5 rounded-lg text-xs font-medium border min-h-[36px] transition-colors ${
                        (filters.bedrooms ?? 0) === b
                          ? 'bg-prairie-600 border-prairie-600 text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {b === 0 ? 'Any' : `${b}+`}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={!!filters.petsAllowed}
                  onChange={(e) => onFilterChange({ ...filters, petsAllowed: e.target.checked || undefined })}
                  className="w-4 h-4 rounded text-prairie-600"
                />
                <span>🐾 Pets Allowed Only</span>
              </label>
            </div>
          )}

          {/* Suggest a Business Sidebar Callout */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60">
            <button
              onClick={onOpenSuggestion}
              className="w-full p-3 bg-prairie-50 dark:bg-prairie-950/40 border border-prairie-200 dark:border-prairie-800 rounded-2xl text-left hover:bg-prairie-100 dark:hover:bg-prairie-900/60 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-prairie-800 dark:text-prairie-200">
                <MessageSquarePlus className="w-4 h-4 text-prairie-600" />
                <span>Know a Great Local Pro?</span>
              </div>
              <p className="text-[11px] text-prairie-700 dark:text-prairie-300 mt-0.5 leading-relaxed">
                Suggest a plumber, snow plow operator, or restaurant to feature.
              </p>
            </button>
          </div>
        </aside>

        {/* Listings Feed */}
        <main className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-800 dark:text-white">{filteredListings.length}</span>{' '}
              {filters.town ? `${filters.town}, IA` : 'Southwest Iowa'} listings
            </div>

            {/* Mobile Category Tabs */}
            <div className="flex sm:hidden items-center gap-1">
              {[
                { id: '', label: 'All' },
                { id: 'rental', label: 'Rentals' },
                { id: 'service', label: 'Services' },
                { id: 'event', label: 'Events' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onFilterChange({ ...filters, categoryType: tab.id as any })}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold min-h-[36px] transition-colors ${
                    activeCategory === tab.id
                      ? 'bg-prairie-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">No matching listings found</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Try widening your town or category filter, or suggest/post a new listing for your community!
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={onOpenSuggestion}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl min-h-[44px] border border-slate-300 dark:border-slate-700"
                >
                  Suggest Business
                </button>
                <button
                  onClick={onOpenCreate}
                  className="bg-prairie-600 hover:bg-prairie-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl min-h-[44px]"
                >
                  Post New Listing
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onClick={onSelectListing}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
