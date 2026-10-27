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
  Edit3,
  Sparkles,
  Mail,
  X,
  Send,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type { Listing, UserProfile } from '../types';
import { ScamWarningBanner } from '../components/ScamWarningBanner';

interface ListingDetailProps {
  listing: Listing;
  currentUser: UserProfile | null;
  onBack: () => void;
  onReport: (listingId: string) => void;
  onSuggestEdit: (listing: Listing) => void;
  onToggleStatus?: (listingId: string, currentStatus: string) => void;
}

export const ListingDetail: React.FC<ListingDetailProps> = ({
  listing,
  currentUser,
  onBack,
  onReport,
  onSuggestEdit,
  onToggleStatus,
}) => {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Inquiry Modal State
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryName, setInquiryName] = useState(currentUser?.name || '');
  const [inquiryEmail, setInquiryEmail] = useState(currentUser?.email || '');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState(
    listing.categoryType === 'rental'
      ? `Hi, I am interested in your rental "${listing.title}" in ${listing.town}, IA. Is it still available? I would like to schedule a viewing.`
      : listing.categoryType === 'service'
      ? `Hi, I saw your service "${listing.title}" on Southwest Iowa Community Central and would like to request a quote / estimate.`
      : `Hi, I have a question regarding "${listing.title}".`
  );
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);

  // Report Modal State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<'scam' | 'outdated' | 'duplicate' | 'inappropriate'>('scam');
  const [reportNotes, setReportNotes] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    setReportFeedback(null);
    try {
      const res = await fetch(`/api/listings/${listing.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason, notes: reportNotes.trim() || undefined }),
      });
      const data = (await res.json()) as any;
      if (res.ok) {
        setReportFeedback(data.message || 'Report submitted for safety review.');
        setTimeout(() => {
          setIsReportOpen(false);
          setReportFeedback(null);
          setReportNotes('');
        }, 2500);
      } else {
        setReportFeedback(data.error || 'Failed to submit report');
      }
    } catch {
      setReportFeedback('Network error submitting report');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySubmitting(true);
    setInquirySuccess(null);
    try {
      const res = await fetch(`/api/listings/${listing.id}/inquire`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: inquiryName.trim(),
          senderEmail: inquiryEmail.trim(),
          senderPhone: inquiryPhone.trim() || undefined,
          message: inquiryMessage.trim(),
        }),
      });
      const data = (await res.json()) as any;
      if (res.ok) {
        setInquirySuccess(data.message || 'Inquiry sent successfully!');
        setTimeout(() => {
          setIsInquiryOpen(false);
          setInquirySuccess(null);
        }, 3000);
      } else {
        setInquirySuccess(data.error || 'Failed to send inquiry');
      }
    } catch {
      setInquirySuccess('Network error submitting inquiry');
    } finally {
      setInquirySubmitting(false);
    }
  };

  const mediaList =
    listing.media && listing.media.length > 0
      ? listing.media
      : [
          {
            id: 'placeholder',
            listingId: listing.id,
            r2Key: '',
            url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
            sortOrder: 0,
            isPrimary: true,
          },
        ];

  // Ownership permission: only admin or the listing creator
  const canManage = currentUser && (currentUser.role === 'admin' || currentUser.id === listing.userId);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = `${listing.title} - Southwest Iowa Community`;
  const shareText = `Check out this listing in ${listing.town}, IA: ${listing.title}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: currentUrl,
        });
        return;
      } catch {
        // Fallback
      }
    }
    setShowShareMenu(!showShareMenu);
  };

  const isRental = listing.categoryType === 'rental';
  const isService = listing.categoryType === 'service';
  const isEvent = listing.categoryType === 'event';

  return (
    <div className="max-w-4xl mx-auto pb-24 pt-3 px-3 sm:px-6">
      {/* Top Bar with Back, Suggest Edit, Share */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[44px] transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Feed</span>
        </button>

        <div className="flex items-center gap-2 relative">
          {/* Suggest an Edit Button */}
          <button
            onClick={() => onSuggestEdit(listing)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[44px] transition-colors shadow-sm"
            title="Suggest a correction or updated phone/address"
          >
            <Edit3 className="w-3.5 h-3.5 text-prairie-600" />
            <span>Suggest Edit</span>
          </button>

          {/* Share Button & Dropdown */}
          <button
            onClick={handleNativeShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[44px] transition-colors shadow-sm"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            <span>Share</span>
          </button>

          {/* Social Share Popover */}
          {showShareMenu && (
            <div className="absolute right-0 top-12 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-2xl w-56 space-y-1.5 text-xs">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Share to Socials
              </span>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
              >
                <span className="w-5 h-5 rounded-full bg-[#1877F2] text-white flex items-center justify-center font-bold text-xs">f</span>
                <span>Facebook</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
              >
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">𝕏</span>
                <span>X / Twitter</span>
              </a>
              <a
                href={`sms:?body=${encodeURIComponent(`${shareText} - ${currentUrl}`)}`}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
              >
                <MessageSquare className="w-4 h-4 text-prairie-600" />
                <span>Text / SMS</span>
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-left"
              >
                <Check className="w-4 h-4 text-slate-400" />
                <span>{copiedShare ? 'Copied!' : 'Copy Web Link'}</span>
              </button>
            </div>
          )}

          {/* Report Button */}
          <button
            onClick={() => setIsReportOpen(true)}
            className="text-slate-400 hover:text-rose-500 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700"
            title="Report this listing for scam, fraud or safety review"
            aria-label="Report listing"
          >
            <Flag className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Owner / Admin Management Notice */}
      {canManage && (
        <div className="mb-3 p-3 bg-prairie-50 dark:bg-prairie-950/40 border border-prairie-200 dark:border-prairie-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-prairie-800 dark:text-prairie-200 font-medium">
            <Shield className="w-4 h-4 text-prairie-600 flex-shrink-0" />
            <span>
              You own this listing {currentUser?.role === 'admin' ? '(Admin Access)' : ''}. Status: <strong>{listing.status.toUpperCase()}</strong>
            </span>
          </div>
          {onToggleStatus && (
            <button
              onClick={() => onToggleStatus(listing.id, listing.status)}
              className="px-3 py-1.5 rounded-lg bg-prairie-600 hover:bg-prairie-500 text-white font-bold text-xs min-h-[36px]"
            >
              {listing.status === 'rented' ? 'Mark Available' : 'Mark Rented / Filled'}
            </button>
          )}
        </div>
      )}

      {/* Media Carousel */}
      <div className="relative aspect-[16/10] sm:aspect-[2/1] w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
        <img
          src={mediaList[activeMediaIndex]?.url}
          alt={listing.title}
          className="w-full h-full object-cover transition-all duration-300"
        />

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
            <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold text-white border border-slate-700">
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

      {/* Main Details Card */}
      <div className="mt-4 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-sm text-slate-900 dark:text-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-prairie-100 dark:bg-prairie-900/60 text-prairie-800 dark:text-prairie-300 border border-prairie-200 dark:border-prairie-700/50 px-3 py-1 rounded-lg text-xs font-bold">
              <MapPin className="w-3.5 h-3.5" />
              {listing.town}, IA {listing.zip && `(${listing.zip})`}
            </span>
            <span className="capitalize text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
              {listing.categoryType}
            </span>
          </div>

          {listing.status === 'rented' && (
            <span className="bg-rose-100 dark:bg-rose-900/80 text-rose-700 dark:text-rose-200 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
              Currently Rented / Unavailable
            </span>
          )}
        </div>

        <h1 className="text-xl sm:text-2xl font-black mt-3 tracking-tight">
          {listing.title}
        </h1>

        {listing.address && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-prairie-600" />
            {listing.address}, {listing.town}, IA
          </p>
        )}

        {/* Direct Action Dock: Call Now, Text SMS, or Inquire Online */}
        <div className="my-5 p-3.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/70 rounded-2xl space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {listing.contactPhone && (
              <>
                <a
                  href={`tel:${listing.contactPhone}`}
                  className="bg-prairie-600 hover:bg-prairie-500 text-white font-bold text-xs sm:text-sm py-3 px-3 rounded-xl flex items-center justify-center gap-2 min-h-[48px] shadow-sm transition-all active:scale-95 text-center"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {listing.contactPhone}</span>
                </a>
                <a
                  href={`sms:${listing.contactPhone}?body=Hello, I am inquiring about your listing "${listing.title}" on Southwest Iowa Community Central:`}
                  className="bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs sm:text-sm py-3 px-3 rounded-xl flex items-center justify-center gap-2 min-h-[48px] shadow-sm transition-all active:scale-95 text-center"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Text SMS</span>
                </a>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsInquiryOpen(true)}
              className={`${
                listing.contactPhone ? '' : 'sm:col-span-3'
              } bg-prairie-700 hover:bg-prairie-600 text-white font-bold text-xs sm:text-sm py-3 px-3 rounded-xl flex items-center justify-center gap-2 min-h-[48px] shadow-sm transition-all active:scale-95 text-center`}
            >
              <Mail className="w-4 h-4" />
              <span>{isRental ? 'Inquire / View' : isService ? 'Request Free Quote' : 'Message Organizer'}</span>
            </button>
          </div>
        </div>

        {/* Rental Specific Specifications */}
        {isRental && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Bedrooms</span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{listing.bedrooms ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Bathrooms</span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{listing.bathrooms ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Deposit</span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {listing.depositCents ? `$${(listing.depositCents / 100).toLocaleString()}` : 'None / Inquire'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block font-medium">Pets Policy</span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                {listing.petsAllowed ? '🐾 Pets Allowed' : 'No Pets'}
              </span>
            </div>
            {listing.laundryType && (
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Laundry</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 capitalize">
                  {listing.laundryType.replace('_', ' ')}
                </span>
              </div>
            )}
            {listing.parkingType && (
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Parking</span>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 capitalize">
                  {listing.parkingType.replace('_', ' ')}
                </span>
              </div>
            )}
            {listing.utilitiesIncluded && listing.utilitiesIncluded.length > 0 && (
              <div className="col-span-2">
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Utilities Included</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {listing.utilitiesIncluded.map((u) => (
                    <span key={u} className="bg-prairie-100 dark:bg-prairie-900/50 text-prairie-800 dark:text-prairie-300 border border-prairie-200 dark:border-prairie-700/40 px-2 py-0.5 rounded text-[11px] capitalize font-semibold">
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
          <div className="my-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {listing.emergencyAvailable && (
                <span className="bg-red-600 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow">
                  <AlertCircle className="w-3.5 h-3.5" /> 24/7 Emergency Service Available
                </span>
              )}
              {listing.insured && (
                <span className="bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 px-3 py-1 rounded-lg flex items-center gap-1.5 font-semibold">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Fully Insured Contractor
                </span>
              )}
              {listing.freeEstimates && (
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1 rounded-lg font-semibold">
                  ✓ Free Estimates
                </span>
              )}
            </div>

            {listing.serviceOfferings && listing.serviceOfferings.length > 0 && (
              <div className="pt-1">
                <span className="text-slate-500 dark:text-slate-400 block mb-1 font-medium">Services Offered:</span>
                <div className="flex flex-wrap gap-1.5">
                  {listing.serviceOfferings.map((offering) => (
                    <span key={offering} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
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
          <div className="my-4 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-prairie-700 dark:text-prairie-300 font-bold text-sm">
                <Calendar className="w-4 h-4" />
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

              <a
                href={`/api/events/calendar.ics?id=${listing.id}`}
                download={`event-${listing.slug}.ics`}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 text-prairie-700 dark:text-prairie-300 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 min-h-[44px] transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Add to Calendar (.ics)</span>
              </a>
            </div>

            {listing.locationVenue && (
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                📍 Venue: {listing.locationVenue}, {listing.town}, IA
              </div>
            )}

            {listing.ticketUrl && (
              <div>
                <a
                  href={listing.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-prairie-600 hover:bg-prairie-500 text-white font-bold px-4 py-2 rounded-xl min-h-[44px] transition-colors shadow-sm"
                >
                  <span>Get Tickets / Details</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Description Section */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700/60">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">Description</h2>
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {listing.description}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>Posted on {new Date(listing.createdAt).toLocaleDateString()}</span>
          <span>Verified Southwest Iowa Community Directory</span>
        </div>
      </div>

      {/* Online Inquiry / Direct Message Modal */}
      {isInquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-5 sm:p-7 shadow-2xl relative text-slate-800 dark:text-slate-100 my-6">
            <button
              onClick={() => setIsInquiryOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-prairie-600 dark:text-prairie-400">
                Direct Contact
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {isRental ? 'Inquire About Rental' : isService ? 'Request Free Estimate' : 'Contact Organizer'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your message will be delivered directly to the owner/contact for <strong>"{listing.title}"</strong>.
              </p>
            </div>

            {inquirySuccess ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>{inquirySuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Miller"
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs min-h-[44px] focus:border-prairie-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs min-h-[44px] focus:border-prairie-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="641-xxx-xxxx"
                      value={inquiryPhone}
                      onChange={(e) => setInquiryPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs min-h-[44px] focus:border-prairie-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs focus:border-prairie-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={inquirySubmitting}
                    className="flex-1 bg-prairie-600 hover:bg-prairie-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 min-h-[44px] shadow-sm transition-all"
                  >
                    {inquirySubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending message...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInquiryOpen(false)}
                    className="px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Safety Report / Scam Flag Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 sm:p-7 shadow-2xl relative text-slate-800 dark:text-slate-100 my-6">
            <button
              onClick={() => setIsReportOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Flag Listing for Review
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Help protect Southwest Iowa neighbors from rental wire-transfer fraud, outdated units, or abusive postings.
              </p>
            </div>

            {reportFeedback ? (
              <div className="p-4 bg-prairie-50 dark:bg-prairie-950/50 border border-prairie-200 dark:border-prairie-800 rounded-2xl text-xs text-prairie-800 dark:text-prairie-200 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-prairie-600 flex-shrink-0" />
                <span>{reportFeedback}</span>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Select Reason
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs min-h-[44px] focus:border-prairie-500 outline-none"
                  >
                    <option value="scam">🚨 Potential Wire/Deposit Scam or Fraud</option>
                    <option value="outdated">🕒 Outdated / Unit Already Rented</option>
                    <option value="duplicate">📄 Duplicate Listing</option>
                    <option value="inappropriate">⚠️ Inappropriate or Misleading Content</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Additional Details (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide any context (e.g. landlord asked for gift cards or deposit before viewing)..."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs focus:border-prairie-500 outline-none resize-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 min-h-[44px] shadow-sm transition-all"
                  >
                    {reportSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Flag className="w-4 h-4" />
                        <span>Submit Safety Report</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
