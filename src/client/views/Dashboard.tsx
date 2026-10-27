import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  PlusCircle,
  Home,
  Wrench,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { Listing } from '../types';

interface DashboardProps {
  listings: Listing[];
  onBack: () => void;
  onOpenCreate: () => void;
  onToggleRented: (listingId: string, currentStatus: string) => Promise<void>;
  onDelete: (listingId: string) => Promise<void>;
  onSelectListing: (listing: Listing) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  listings,
  onBack,
  onOpenCreate,
  onToggleRented,
  onDelete,
  onSelectListing,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'rented'>('all');

  const filtered = listings.filter((l) => {
    if (filter === 'all') return true;
    return l.status === filter;
  });

  return (
    <div className="max-w-4xl mx-auto pb-24 pt-2 px-3 sm:px-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <button
          onClick={onOpenCreate}
          className="bg-prairie-600 hover:bg-prairie-500 text-white font-semibold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>

      <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-6 mb-6">
        <h1 className="text-xl font-bold text-white">Owner & Contractor Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage your Southwest Iowa properties and service postings. Quick-toggle vacancy or availability in one tap.
        </p>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mt-4">
          {(['all', 'active', 'rented'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize min-h-[38px] transition-colors ${
                filter === tab
                  ? 'bg-prairie-600 text-white'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {tab} ({listings.filter((l) => (tab === 'all' ? true : l.status === tab)).length})
            </button>
          ))}
        </div>
      </div>

      {/* Listings List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-800">
            <p className="text-sm text-slate-400">No listings found in this category.</p>
            <button
              onClick={onOpenCreate}
              className="mt-3 text-xs font-semibold text-prairie-400 hover:underline"
            >
              Create your first listing →
            </button>
          </div>
        ) : (
          filtered.map((item) => {
            const isRented = item.status === 'rented';
            const primaryImg = item.media?.[0]?.url;

            return (
              <div
                key={item.id}
                className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer flex-1"
                  onClick={() => onSelectListing(item)}
                >
                  {primaryImg ? (
                    <img
                      src={primaryImg}
                      alt={item.title}
                      className="w-16 h-16 rounded-lg object-cover bg-slate-900 border border-slate-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-500">
                      {item.categoryType === 'rental' && <Home className="w-6 h-6" />}
                      {item.categoryType === 'service' && <Wrench className="w-6 h-6" />}
                      {item.categoryType === 'event' && <Calendar className="w-6 h-6" />}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-prairie-400">
                        {item.town}, IA
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isRented
                            ? 'bg-rose-900/80 text-rose-200'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        }`}
                      >
                        {isRented ? 'Rented' : 'Active'}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-100 text-sm mt-0.5 line-clamp-1 hover:text-prairie-300">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.priceCents ? `$${(item.priceCents / 100).toLocaleString()}` : 'Free / Contact'}
                      {' • '}Expires {new Date(item.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Dashboard Fast Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/60">
                  {/* Mark as Rented / Available Quick Switch */}
                  <button
                    onClick={() => onToggleRented(item.id, item.status)}
                    className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[44px] transition-colors ${
                      isRented
                        ? 'bg-prairie-700 hover:bg-prairie-600 text-white'
                        : 'bg-amber-900/60 hover:bg-amber-900 text-amber-200 border border-amber-700/60'
                    }`}
                  >
                    {isRented ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>Mark Available</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-amber-300" />
                        <span>Mark Rented</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onSelectListing(item)}
                    className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    title="View public page"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-2 rounded-lg bg-slate-700/80 hover:bg-rose-900 text-rose-300 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                    title="Archive listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
