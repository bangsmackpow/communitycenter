import React from 'react';
import {
  MapPin,
  Phone,
  MessageSquare,
  Home,
  Wrench,
  Calendar,
  AlertCircle,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { Listing } from '../types';

interface ListingCardProps {
  listing: Listing;
  onClick: (listing: Listing) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
  const primaryMedia =
    listing.media?.[0]?.url ||
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

  const formatPrice = (cents?: number | null) => {
    if (!cents && cents !== 0) return null;
    return `$${(cents / 100).toLocaleString()}`;
  };

  const isRental = listing.categoryType === 'rental';
  const isService = listing.categoryType === 'service';
  const isEvent = listing.categoryType === 'event';

  return (
    <article
      onClick={() => onClick(listing)}
      className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 hover:border-prairie-500 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col group relative text-slate-800 dark:text-slate-100"
    >
      {/* Top Media & Badges */}
      <div className="relative aspect-[16/10] w-full bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <img
          src={primaryMedia}
          alt={listing.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Town Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-white border border-slate-700/60 shadow">
          <MapPin className="w-3 h-3 text-prairie-400" />
          <span>{listing.town}, IA</span>
        </div>

        {/* Status / Featured Badge */}
        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
          {listing.status === 'rented' ? (
            <span className="bg-rose-900/90 text-rose-200 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow">
              Rented / Filled
            </span>
          ) : listing.isFeatured ? (
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-md flex items-center gap-1 shadow">
              <Sparkles className="w-3 h-3" /> Featured
            </span>
          ) : null}

          {/* Emergency Service Pill */}
          {isService && listing.emergencyAvailable && (
            <span className="bg-red-600 text-white font-bold text-[10px] tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1 shadow animate-pulse">
              <AlertCircle className="w-3 h-3" /> 24/7 Emergency
            </span>
          )}
        </div>

        {/* Price Tag Pill */}
        {listing.priceCents !== undefined && listing.priceCents !== null && (
          <div className="absolute bottom-2.5 left-2.5 bg-slate-950/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-sm font-black text-white border border-slate-700/80 shadow">
            {formatPrice(listing.priceCents)}
            {isRental && <span className="text-[10px] font-normal text-slate-300 ml-0.5">/mo</span>}
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-prairie-700 dark:text-prairie-400 font-bold mb-1">
            {isRental && <Home className="w-3.5 h-3.5" />}
            {isService && <Wrench className="w-3.5 h-3.5" />}
            {isEvent && <Calendar className="w-3.5 h-3.5" />}
            <span className="capitalize">{listing.categoryType}</span>
            {listing.categoryType === 'service' && listing.serviceRadiusMiles && (
              <span className="font-normal text-slate-500 dark:text-slate-400">• {listing.serviceRadiusMiles} mi radius</span>
            )}
          </div>

          <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-prairie-600 dark:group-hover:text-prairie-300 transition-colors">
            {listing.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300/80 line-clamp-2 mt-1.5 leading-relaxed font-normal">
            {listing.description}
          </p>

          {/* Rental Specific Details */}
          {isRental && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              {listing.bedrooms !== undefined && listing.bedrooms !== null && (
                <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                  {listing.bedrooms} Beds
                </span>
              )}
              {listing.bathrooms !== undefined && listing.bathrooms !== null && (
                <span className="bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-md">
                  {listing.bathrooms} Bath
                </span>
              )}
              {listing.petsAllowed && (
                <span className="bg-prairie-100 dark:bg-prairie-900/60 text-prairie-800 dark:text-prairie-300 px-2 py-0.5 rounded-md">
                  🐾 Pets
                </span>
              )}
            </div>
          )}

          {/* Service Specific Details */}
          {isService && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[11px]">
              {listing.insured && (
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                  <Shield className="w-3 h-3" /> Insured
                </span>
              )}
              {listing.freeEstimates && (
                <span className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-md font-semibold">
                  Free Estimates
                </span>
              )}
            </div>
          )}

          {/* Event Specific Details */}
          {isEvent && (
            <div className="mt-3 space-y-1 text-[11px]">
              <div className="flex items-center gap-1 text-prairie-700 dark:text-prairie-300 font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {listing.eventDate
                    ? new Date(listing.eventDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        weekday: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Upcoming'}
                </span>
              </div>
              {listing.locationVenue && (
                <div className="text-slate-500 dark:text-slate-400 truncate">📍 {listing.locationVenue}</div>
              )}
            </div>
          )}
        </div>

        {/* Direct Action Buttons: Call & Text SMS */}
        <div
          className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {listing.contactPhone ? (
            <>
              <a
                href={`tel:${listing.contactPhone}`}
                className="flex-1 bg-prairie-600 hover:bg-prairie-500 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] transition-colors shadow-sm text-center"
                title={`Call ${listing.contactPhone}`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
              <a
                href={`sms:${listing.contactPhone}?body=Hi, I saw your listing for "${listing.title}" on Southwest Iowa Community Central:`}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 min-h-[44px] transition-colors border border-slate-300 dark:border-slate-600 text-center"
                title={`Text SMS ${listing.contactPhone}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Text</span>
              </a>
            </>
          ) : (
            <button
              onClick={() => onClick(listing)}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold py-2 px-3 rounded-xl min-h-[44px] transition-colors text-center"
            >
              View Listing Details →
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
