import React, { useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Phone,
  MessageSquare,
  Share2,
  Calendar,
  Shield,
  AlertCircle,
  Home,
  Wrench,
  Check,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
  Flag,
} from 'lucide-react';
import type { Listing } from '../types';
import { ScamWarningBanner } from '../components/ScamWarningBanner';

interface ListingDetailProps {
  listing: Listing;
  onBack: () => void;
  onReport: (listingId: string) => void;
}

export const ListingDetail: React.FC<ListingDetailProps> = ({
  listing,
  onBack,
  onReport,
}) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);

  const mediaList = listing.media && listing.media.length > 0
    ? listing.media
    : [{ id: 'placeholder', listingId: listing.id, r2Key: '', url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80', sortOrder: 0, isPrimary: true }];

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${listing.title} - Southwest Iowa Community`,
          text: `Check out this listing in ${listing.town}, IA: ${listing.title}`,
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const isRental = listing.categoryType === 'rental';
  const isService = listing.categoryType === 'service';
  const isEvent = listing.categoryType === 'event';

  return (
    <div className="max-w-4xl mx-auto pb-24 pt-2 px-3 sm:px-6">
      {/* Top Bar with Back and Share */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 min-h-[44px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 min-h-[44px] transition-colors"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copiedShare ? 'Link Copied!' : 'Share'}</span>
          </button>
          <button
            onClick={() => onReport(listing.id)}
            className="text-slate-400 hover:text-rose-400 p-2 rounded-lg hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            title="Report this listing"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Media Carousel */}
      <div className="relative aspect-[16/10] sm:aspect-[2/1] w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg">
        <img
          src={mediaList[activeMediaIndex]?.url}
          alt={listing.title}
          className="w-full h-full object-cover transition-all duration-300"
        />

        {/* Carousel Prev/Next Buttons */}
        {mediaList.length > 1 && (
          <>
            <button
              onClick={() => setActiveMediaIndex((prev) => (prev === 0 ? mediaList.length - 1 : prev - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center backdrop-blur border border-slate-700"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveMediaIndex((prev) => (prev === mediaList.length - 1 ? 0 : prev + 1))}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center backdrop-blur border border-slate-700"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold text-slate-200 border border-slate-700">
              {activeMediaIndex + 1} / {mediaList.length}
            </div>
          </>
        )}

        {/* Floating Price Pill */}
        {listing.priceCents !== undefined && listing.priceCents !== null && (
          <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl text-lg font-black text-white border border-slate-700/80 shadow-md">
            ${(listing.priceCents / 100).toLocaleString()}
            {isRental && <span className="text-xs font-normal text-slate-300 ml-1">/month</span>}
          </div>
        )}
      </div>

      {/* Anti-Scam Banner for all Rental Listings */}
      {isRental && <ScamWarningBanner />}

      {/* Main Details */}
      <div className="mt-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-prairie-900/60 text-prairie-300 border border-prairie-700/50 px-2.5 py-1 rounded-md text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              {listing.town}, IA {listing.zip && `(${listing.zip})`}
            </span>
            <span className="capitalize text-xs font-medium text-slate-400 bg-slate-700/50 px-2 py-1 rounded-md">
              {listing.categoryType}
            </span>
          </div>

          {listing.status === 'rented' && (
            <span className="bg-rose-900/80 text-rose-200 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
              Currently Rented / Unavailable
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-black text-white mt-3 tracking-tight">
          {listing.title}
        </h1>

        {listing.address && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            {listing.address}, {listing.town}, IA
          </p>
        )}

        {/* Sticky Mobile Direct Action Dock */}
        <div className="grid grid-cols-2 gap-2.5 my-4 p-3 bg-slate-900/80 border border-slate-700/70 rounded-xl">
          {listing.contactPhone ? (
            <>
              <a
                href={`tel:${listing.contactPhone}`}
                className="bg-prairie-600 hover:bg-prairie-500 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 min-h-[48px] shadow-sm transition-all active:scale-95 text-center"
              >
                <Phone className="w-4 h-4" />
                <span>Call Now</span>
              </a>
              <a
                href={`sms:${listing.contactPhone}?body=Hello, I am inquiring about your listing "${listing.title}" on Southwest Iowa Community Central:`}
                className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 min-h-[48px] shadow-sm transition-all active:scale-95 text-center"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Text SMS</span>
              </a>
            </>
          ) : (
            <div className="col-span-2 text-center text-xs text-slate-400 py-1">
              Contact Email: {listing.contactEmail || 'Available via platform'}
            </div>
          )}
        </div>

        {/* Rental Specific Specifications */}
        {isRental && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3.5 bg-slate-900/50 rounded-xl border border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block">Bedrooms</span>
              <span className="font-bold text-slate-200 text-sm">{listing.bedrooms ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Bathrooms</span>
              <span className="font-bold text-slate-200 text-sm">{listing.bathrooms ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Security Deposit</span>
              <span className="font-bold text-slate-200 text-sm">
                {listing.depositCents ? `$${(listing.depositCents / 100).toLocaleString()}` : 'None / Inquire'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Pets Policy</span>
              <span className="font-bold text-slate-200 text-sm">
                {listing.petsAllowed ? '🐾 Allowed' : 'No Pets'}
              </span>
            </div>
            {listing.laundryType && (
              <div>
                <span className="text-slate-400 block">Laundry</span>
                <span className="font-bold text-slate-200 text-sm capitalize">
                  {listing.laundryType.replace('_', ' ')}
                </span>
              </div>
            )}
            {listing.parkingType && (
              <div>
                <span className="text-slate-400 block">Parking</span>
                <span className="font-bold text-slate-200 text-sm capitalize">
                  {listing.parkingType.replace('_', ' ')}
                </span>
              </div>
            )}
            {listing.utilitiesIncluded && listing.utilitiesIncluded.length > 0 && (
              <div className="col-span-2">
                <span className="text-slate-400 block">Utilities Included</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {listing.utilitiesIncluded.map((u) => (
                    <span key={u} className="bg-prairie-900/50 text-prairie-300 border border-prairie-700/40 px-2 py-0.5 rounded text-[11px] capitalize">
                      ✓ {u}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Service Contractor Specific Specifications */}
        {isService && (
          <div className="my-4 p-3.5 bg-slate-900/50 rounded-xl border border-slate-700/60 text-xs space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {listing.emergencyAvailable && (
                <span className="bg-red-600/90 text-white font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow">
                  <AlertCircle className="w-3.5 h-3.5" /> 24/7 Emergency Response Available
                </span>
              )}
              {listing.insured && (
                <span className="bg-emerald-900/80 text-emerald-200 border border-emerald-700/50 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> Fully Insured Contractor
                </span>
              )}
              {listing.freeEstimates && (
                <span className="bg-slate-700/80 text-slate-200 px-2.5 py-1 rounded-md">
                  ✓ Free Estimates Provided
                </span>
              )}
            </div>

            {listing.serviceOfferings && listing.serviceOfferings.length > 0 && (
              <div>
                <span className="text-slate-400 block mb-1">Services & Capabilities:</span>
                <div className="flex flex-wrap gap-1.5">
                  {listing.serviceOfferings.map((offering) => (
                    <span key={offering} className="bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                      • {offering}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Event Specific Specifications */}
        {isEvent && (
          <div className="my-4 p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 text-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-prairie-300 font-semibold text-sm">
                <Calendar className="w-4 h-4 text-prairie-400" />
                <span>
                  {listing.eventDate
                    ? new Date(listing.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Date TBA'}
                </span>
              </div>

              {/* Calendar ICS Export Button */}
              <a
                href={`/api/events/calendar.ics?id=${listing.id}`}
                download={`event-${listing.slug}.ics`}
                className="bg-slate-800 hover:bg-slate-700 text-prairie-300 border border-slate-700 px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 min-h-[44px] transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Add to Calendar (.ics)</span>
              </a>
            </div>

            {listing.locationVenue && (
              <div className="text-slate-300 font-medium">
                📍 Venue: {listing.locationVenue}, {listing.town}, IA
              </div>
            )}

            {listing.ticketUrl && (
              <div>
                <a
                  href={listing.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-prairie-600 hover:bg-prairie-500 text-white font-bold px-4 py-2 rounded-lg min-h-[44px] transition-colors"
                >
                  <span>Get Tickets / Event Page</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Description Section */}
        <div className="mt-4 pt-4 border-t border-slate-700/60">
          <h2 className="text-sm font-bold text-slate-200 mb-2">Description</h2>
          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
            {listing.description}
          </div>
        </div>

        {/* Expiration and Trust Notice */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>Posted on {new Date(listing.createdAt).toLocaleDateString()}</span>
          <span>Listing active through {new Date(listing.expiresAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};
