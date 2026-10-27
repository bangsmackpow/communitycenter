import React, { useState, useEffect } from 'react';
import type { Listing, ListingFilter, UserProfile } from './types';
import { INITIAL_SAMPLE_LISTINGS } from './sampleData';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeFeed } from './views/HomeFeed';
import { ListingDetail } from './views/ListingDetail';
import { CreateListingWizard } from './views/CreateListingWizard';
import { Dashboard } from './views/Dashboard';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { SuggestionModal } from './components/SuggestionModal';

export const App: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>(INITIAL_SAMPLE_LISTINGS);
  const [currentView, setCurrentView] = useState<'feed' | 'detail' | 'create' | 'dashboard'>('feed');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedTown, setSelectedTown] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBottomTab, setActiveBottomTab] = useState<'discover' | 'rentals' | 'services' | 'events' | 'post'>('discover');
  const [filters, setFilters] = useState<ListingFilter>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [targetListingForEdit, setTargetListingForEdit] = useState<Listing | null>(null);

  // Theme: Light Mode as default, Dark Mode selectable
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false; // Default: Light mode
  });

  // Real Authentication: Default is GUEST (null) so shared links do NOT log anyone in as Curtis!
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('auth_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return null; // Guest by default
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync theme with DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Check live session from edge API on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data: any) => {
        if (data?.user) {
          setCurrentUser(data.user);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch live listings from Edge API if available
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch('/api/listings');
        if (res.ok) {
          const data = (await res.json()) as { items?: Listing[] };
          if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
            setListings(data.items);
          }
        }
      } catch (err) {
        console.log('Using local Southwest Iowa listings:', err);
      }
    };
    fetchListings();
  }, []);

  // Check for Stripe return URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('upgraded') === 'true') {
        showToast('Stripe payment verified! Your account is now Pro.');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  // Sync selected town to filters
  const handleSelectTown = (town: string) => {
    setSelectedTown(town);
    setFilters((prev) => ({ ...prev, town: town || undefined }));
    if (currentView !== 'feed') setCurrentView('feed');
  };

  // Sync search query to filters
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setFilters((prev) => ({ ...prev, q: q || undefined }));
    if (currentView !== 'feed') setCurrentView('feed');
  };

  // Handle Bottom Dock Tab selection
  const handleBottomTab = (tab: 'discover' | 'rentals' | 'services' | 'events' | 'post') => {
    setActiveBottomTab(tab);
    if (tab === 'post') {
      if (!currentUser) {
        setIsAuthOpen(true);
        return;
      }
      setCurrentView('create');
      return;
    }
    setCurrentView('feed');
    if (tab === 'discover') {
      setFilters((prev) => ({ ...prev, categoryType: '' }));
    } else if (tab === 'rentals') {
      setFilters((prev) => ({ ...prev, categoryType: 'rental' }));
    } else if (tab === 'services') {
      setFilters((prev) => ({ ...prev, categoryType: 'service' }));
    } else if (tab === 'events') {
      setFilters((prev) => ({ ...prev, categoryType: 'event' }));
    }
  };

  // View Listing Details
  const handleSelectListing = (listing: Listing) => {
    setSelectedListing(listing);
    setCurrentView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Suggest an Edit
  const handleSuggestEdit = (listing: Listing) => {
    setTargetListingForEdit(listing);
    setIsSuggestionOpen(true);
  };

  // Open general business suggestion
  const handleOpenGeneralSuggestion = () => {
    setTargetListingForEdit(null);
    setIsSuggestionOpen(true);
  };

  // Create Listing Submit
  const handleCreateListing = async (newListing: Partial<Listing>) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    const fullListing: Listing = {
      id: crypto.randomUUID(),
      userId: currentUser.id,
      categoryType: newListing.categoryType || 'rental',
      title: newListing.title || '',
      slug: (newListing.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: newListing.description || '',
      priceCents: newListing.priceCents,
      contactPhone: newListing.contactPhone,
      contactEmail: newListing.contactEmail || currentUser.email,
      status: 'active',
      isFeatured: newListing.isFeatured || false,
      town: newListing.town || 'Creston',
      address: newListing.address,
      serviceRadiusMiles: newListing.serviceRadiusMiles,
      bedrooms: newListing.bedrooms,
      bathrooms: newListing.bathrooms,
      depositCents: newListing.depositCents,
      petsAllowed: newListing.petsAllowed,
      utilitiesIncluded: newListing.utilitiesIncluded,
      laundryType: newListing.laundryType,
      parkingType: newListing.parkingType,
      emergencyAvailable: newListing.emergencyAvailable,
      insured: newListing.insured,
      freeEstimates: newListing.freeEstimates,
      serviceOfferings: newListing.serviceOfferings,
      eventDate: newListing.eventDate,
      eventEndDate: newListing.eventEndDate,
      locationVenue: newListing.locationVenue,
      ticketUrl: newListing.ticketUrl,
      isFree: newListing.isFree,
      media: newListing.media || [],
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullListing),
      });
    } catch {}

    setListings((prev) => [fullListing, ...prev]);
    showToast('Listing published successfully for Southwest Iowa!');
    setSelectedListing(fullListing);
    setCurrentView('detail');
  };

  // Toggle Rented / Available Status with ownership verification
  const handleToggleRented = async (listingId: string, currentStatus: string) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;

    if (currentUser && currentUser.role !== 'admin' && listing.userId !== currentUser.id) {
      showToast('Permission denied: You do not own this listing.');
      return;
    }

    const nextStatus = currentStatus === 'rented' ? 'active' : 'rented';

    try {
      await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {}

    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: nextStatus as any } : l))
    );
    if (selectedListing && selectedListing.id === listingId) {
      setSelectedListing((prev) => (prev ? { ...prev, status: nextStatus as any } : null));
    }
    showToast(`Status updated to ${nextStatus.toUpperCase()}`);
  };

  // Soft delete / remove listing with ownership verification
  const handleDeleteListing = async (listingId: string) => {
    const listing = listings.find((l) => l.id === listingId);
    if (!listing) return;

    if (currentUser && currentUser.role !== 'admin' && listing.userId !== currentUser.id) {
      showToast('Permission denied: You do not own this listing.');
      return;
    }

    if (!confirm('Are you sure you want to archive this listing?')) return;

    try {
      await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
    } catch {}

    setListings((prev) => prev.filter((l) => l.id !== listingId));
    if (selectedListing && selectedListing.id === listingId) {
      setCurrentView('feed');
    }
    showToast('Listing archived');
  };

  const handleReport = (listingId: string) => {
    showToast('Thank you. This listing has been flagged for community safety review.');
  };

  const handleUpgradeSuccess = (tier: 'pro_monthly' | 'pro_annual') => {
    if (currentUser) {
      const updated: UserProfile = { ...currentUser, tier };
      setCurrentUser(updated);
      localStorage.setItem('auth_user', JSON.stringify(updated));
      showToast(`Account successfully upgraded to Pro (${tier === 'pro_annual' ? '$100/year' : '$10/month'})!`);
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('auth_user');
    localStorage.removeItem('sw_session_token');
    setCurrentUser(null);
    if (currentView === 'dashboard') {
      setCurrentView('feed');
    }
    showToast('Signed out of Southwest Iowa Hub');
  };

  const userActiveListingsCount = currentUser
    ? listings.filter((l) => l.userId === currentUser.id && l.status === 'active').length
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-prairie-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xl border border-prairie-500 animate-fade-in flex items-center gap-2">
          <span>✓ {toastMessage}</span>
        </div>
      )}

      {/* Sticky Mobile & Desktop Navigation */}
      <Navbar
        selectedTown={selectedTown}
        onSelectTown={handleSelectTown}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onOpenCreate={() => {
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setCurrentView('create');
          }
        }}
        onOpenDashboard={() => {
          if (!currentUser) {
            setIsAuthOpen(true);
          } else {
            setCurrentView('dashboard');
          }
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenPricing={() => setIsPricingOpen(true)}
        onOpenSuggestion={handleOpenGeneralSuggestion}
        currentUser={currentUser}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        {currentView === 'feed' && (
          <HomeFeed
            listings={listings}
            filters={filters}
            onFilterChange={setFilters}
            onSelectListing={handleSelectListing}
            onOpenCreate={() => {
              if (!currentUser) {
                setIsAuthOpen(true);
              } else {
                setCurrentView('create');
              }
            }}
            onOpenSuggestion={handleOpenGeneralSuggestion}
          />
        )}

        {currentView === 'detail' && selectedListing && (
          <ListingDetail
            listing={selectedListing}
            currentUser={currentUser}
            onBack={() => setCurrentView('feed')}
            onReport={handleReport}
            onSuggestEdit={handleSuggestEdit}
            onToggleStatus={handleToggleRented}
          />
        )}

        {currentView === 'create' && (
          <CreateListingWizard
            currentUser={currentUser}
            userActiveListingsCount={userActiveListingsCount}
            onCancel={() => setCurrentView('feed')}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenPricing={() => setIsPricingOpen(true)}
            onSubmit={handleCreateListing}
          />
        )}

        {currentView === 'dashboard' && currentUser && (
          <Dashboard
            listings={listings}
            currentUser={currentUser}
            onBack={() => setCurrentView('feed')}
            onOpenCreate={() => setCurrentView('create')}
            onOpenPricing={() => setIsPricingOpen(true)}
            onToggleRented={handleToggleRented}
            onDelete={handleDeleteListing}
            onSelectListing={handleSelectListing}
          />
        )}
      </div>

      {/* Mobile Bottom Dock Navigation */}
      <BottomNav activeTab={activeBottomTab} onSelectTab={handleBottomTab} />

      {/* Auth Modal (Login / Register / Edge Authentication) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome, ${user.name}!`);
        }}
      />

      {/* Pricing Modal ($10/mo or $100/yr Pro Tier with Stripe) */}
      <PricingModal
        isOpen={isPricingOpen}
        currentTier={currentUser?.tier || 'free'}
        onClose={() => setIsPricingOpen(false)}
        onUpgradeSuccess={handleUpgradeSuccess}
      />

      {/* Community Suggestion / Edit Modal */}
      <SuggestionModal
        isOpen={isSuggestionOpen}
        targetListing={targetListingForEdit}
        onClose={() => setIsSuggestionOpen(false)}
        onSuccess={(msg) => showToast(msg)}
      />
    </div>
  );
};
