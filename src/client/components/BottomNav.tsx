import React from 'react';
import { Compass, Home, Wrench, Calendar, PlusCircle } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'discover' | 'rentals' | 'services' | 'events' | 'post';
  onSelectTab: (tab: 'discover' | 'rentals' | 'services' | 'events' | 'post') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs: Array<{
    id: 'discover' | 'rentals' | 'services' | 'events' | 'post';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isHighlight?: boolean;
  }> = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'rentals', label: 'Rentals', icon: Home },
    { id: 'post', label: 'Post', icon: PlusCircle, isHighlight: true },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'events', label: 'Events', icon: Calendar },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 pb-safe shadow-lg">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isHighlight) {
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                aria-label="Post a new listing"
                className="flex flex-col items-center justify-center -mt-4 group min-h-[44px]"
              >
                <div className="w-12 h-12 rounded-full bg-prairie-600 text-white flex items-center justify-center shadow-lg shadow-prairie-900/50 group-active:scale-95 transition-transform border-2 border-slate-900">
                  <PlusCircle className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-semibold text-prairie-400 mt-0.5">Post (+)</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[44px] py-1 transition-colors ${
                isActive ? 'text-prairie-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-[11px] mt-0.5 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
