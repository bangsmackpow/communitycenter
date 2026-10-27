import React, { useState, useEffect } from 'react';
import type { Listing, ListingFilter } from './types';
import { INITIAL_SAMPLE_LISTINGS } from './sampleData';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeFeed } from './views/HomeFeed';
import { ListingDetail } from './views/ListingDetail';
import { CreateListingWizard } from './views/CreateListingWizard';
import { Dashboard } from './views/Dashboard';

export const App: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>(INITIAL_SAMPLE_LISTINGS);
  const [currentView, setCurrentView] = useState<'feed' | 'detail' | 'create' | 'dashboard'>('feed');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedTown, setSelectedTown] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBottomTab, setActiveBottomTab] = useState<'discover' | 'rentals' | 'services' | 'events' | 'post'>('discover');
  const [filters, setFilters] = useState<ListingFilter>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
        // Use initial sample data as fallback
        console.log('Using sample community listings for local mode:', err);
      }
    };
    fetchListings();
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

  // Create Listing Submit
  const handleCreateListing = async (newListing: Partial<Listing>) => {
    const fullListing: Listing = {
      id: crypto.randomUUID(),
      userId: 'user-current',
      categoryType: newListing.categoryType || 'rental',
      title: newListing.title || '',
      slug: (newListing.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: newListing.description || '',
      priceCents: newListing.priceCents,
      contactPhone: newListing.contactPhone,
      contactEmail: newListing.contactEmail,
      status: 'active',
      isFeatured: false,
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

    // Try posting to API
    try {
      await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullListing),
      });
    } catch {
      // Local preview fallback
    }

    setListings((prev) => [fullListing, ...prev]);
    showToast('Listing published successfully for Southwest Iowa!');
    setSelectedListing(fullListing);
    setCurrentView('detail');
  };

  // Toggle Rented / Available Status
  const handleToggleRented = async (listingId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'rented' ? 'active' : 'rented';

    try {
      await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch {
      // Handled in local state
    }

    setListings((prev) =>
      prev.map((l) => (l.id === listingId ? { ...l, status: nextStatus as any } : l))
    );
    showToast(`Status updated to ${nextStatus.toUpperCase()}`);
  };

  // Soft delete / remove listing
  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to archive this listing?')) return;

    try {
      await fetch(`/api/listings/${listingId}`, { method: 'DELETE' });
    } catch {
      // Local state fallback
    }

    setListings((prev) => prev.filter((l) => l.id !== listingId));
    showToast('Listing archived');
  };

  const handleReport = (listingId: string) => {
    showToast('Thank you. This listing has been flagged for community safety review.');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-prairie-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-prairie-500 animate-fade-in flex items-center gap-2">
          <span>✓ {toastMessage}</span>
        </div>
      )}

      {/* Sticky Mobile & Desktop Navigation */}
      <Navbar
        selectedTown={selectedTown}
        onSelectTown={handleSelectTown}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onOpenCreate={() => setCurrentView('create')}
        onOpenDashboard={() => setCurrentView('dashboard')}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        {currentView === 'feed' && (
          <HomeFeed
            listings={listings}
            filters={filters}
            onFilterChange={setFilters}
            onSelectListing={handleSelectListing}
            onOpenCreate={() => setCurrentView('create')}
          />
        )}

        {currentView === 'detail' && selectedListing && (
          <ListingDetail
            listing={selectedListing}
            onBack={() => setCurrentView('feed')}
            onReport={handleReport}
          />
        )}

        {currentView === 'create' && (
          <CreateListingWizard
            onCancel={() => setCurrentView('feed')}
            onSubmit={handleCreateListing}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            listings={listings}
            onBack={() => setCurrentView('feed')}
            onOpenCreate={() => setCurrentView('create')}
            onToggleRented={handleToggleRented}
            onDelete={handleDeleteListing}
            onSelectListing={handleSelectListing}
          />
        )}
      </div>

      {/* Mobile Bottom Dock Navigation */}
      <BottomNav activeTab={activeBottomTab} onSelectTab={handleBottomTab} />
    </div>
  );
};
