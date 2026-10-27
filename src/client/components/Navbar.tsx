import React from 'react';
import { MapPin, Search, PlusCircle, ShieldCheck } from 'lucide-react';
import { SW_IOWA_TOWNS } from '../../db/constants';

interface NavbarProps {
  selectedTown: string;
  onSelectTown: (town: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCreate: () => void;
  onOpenDashboard: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedTown,
  onSelectTown,
  searchQuery,
  onSearchChange,
  onOpenCreate,
  onOpenDashboard,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Region Indicator */}
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={() => onSelectTown('')}>
            <div className="w-10 h-10 rounded-xl bg-prairie-700/80 border border-prairie-500/30 flex items-center justify-center shadow-inner">
              <span className="text-prairie-100 font-black text-lg">IA</span>
            </div>
            <div className="hidden xs:block">
              <h1 className="text-base font-bold text-slate-100 tracking-tight leading-tight">
                Southwest Iowa
              </h1>
              <p className="text-[11px] text-prairie-400 font-medium">Community Central</p>
            </div>
          </div>

          {/* Sticky Local Town Dropdown */}
          <div className="relative flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 min-h-[44px] hover:border-prairie-500 transition-colors">
              <MapPin className="w-4 h-4 text-prairie-400 flex-shrink-0" />
              <select
                aria-label="Select Southwest Iowa Town"
                value={selectedTown}
                onChange={(e) => onSelectTown(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-200 outline-none cursor-pointer pr-1"
              >
                <option value="" className="bg-slate-900 text-slate-200">
                  All Southwest Iowa
                </option>
                {SW_IOWA_TOWNS.map((town) => (
                  <option key={town} value={town} className="bg-slate-900 text-slate-200">
                    {town}, IA
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Search on Desktop & Tablet */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search rentals, contractors, events..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-prairie-500 min-h-[44px]"
            />
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={onOpenDashboard}
              className="px-3 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 min-h-[44px] flex items-center gap-1.5 transition-colors border border-transparent hover:border-slate-700"
            >
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Dashboard
            </button>
            <button
              onClick={onOpenCreate}
              className="bg-prairie-600 hover:bg-prairie-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 min-h-[44px] shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Post Listing
            </button>
          </div>
        </div>

        {/* Mobile Search Input Bar */}
        <div className="mt-2 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search Creston, Corning rentals, services..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-prairie-500 min-h-[44px]"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
