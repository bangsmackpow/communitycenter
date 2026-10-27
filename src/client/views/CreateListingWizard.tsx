import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Home,
  Wrench,
  Calendar,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  Zap,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { SW_IOWA_TOWNS } from '../../db/constants';
import { ImageUploader, UploadedMediaItem } from '../components/ImageUploader';
import type { Listing, UserProfile } from '../types';

interface CreateListingWizardProps {
  currentUser: UserProfile | null;
  userActiveListingsCount: number;
  onCancel: () => void;
  onOpenAuth: () => void;
  onOpenPricing: () => void;
  onSubmit: (listing: Partial<Listing>) => Promise<void>;
}

export const CreateListingWizard: React.FC<CreateListingWizardProps> = ({
  currentUser,
  userActiveListingsCount,
  onCancel,
  onOpenAuth,
  onOpenPricing,
  onSubmit,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [categoryType, setCategoryType] = useState<'rental' | 'service' | 'event'>('rental');
  const [town, setTown] = useState<string>('Creston');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState<string>('');
  const [address, setAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [isFeatured, setIsFeatured] = useState(false);
  const [mediaList, setMediaList] = useState<UploadedMediaItem[]>([]);

  // Rental specific
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [depositCents, setDepositCents] = useState<string>('');
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [utilities, setUtilities] = useState<string[]>(['water', 'trash']);
  const [laundryType, setLaundryType] = useState<'in_unit' | 'hookups' | 'shared' | 'none'>('hookups');
  const [parkingType, setParkingType] = useState<'garage' | 'off_street' | 'street'>('off_street');

  // Service specific
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [insured, setInsured] = useState(true);
  const [freeEstimates, setFreeEstimates] = useState(true);
  const [serviceRadiusMiles, setServiceRadiusMiles] = useState<number>(30);
  const [tagInput, setTagInput] = useState('');
  const [serviceOfferings, setServiceOfferings] = useState<string[]>([]);

  // Event specific
  const [eventDate, setEventDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [locationVenue, setLocationVenue] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [isFree, setIsFree] = useState(true);

  const isProOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.tier === 'pro_monthly' ||
    currentUser?.tier === 'pro_annual';

  // Tier limit check for free users: maximum 1 active listing
  const isLimitReached = !isProOrAdmin && userActiveListingsCount >= 1;

  const toggleUtility = (u: string) => {
    setUtilities((prev) => (prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]));
  };

  const addTag = () => {
    if (tagInput.trim() && !serviceOfferings.includes(tagInput.trim())) {
      setServiceOfferings([...serviceOfferings, tagInput.trim()]);
      setTagInput('');
    }
  };

  // If user is not logged in, prompt sign in first
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="w-12 h-12 bg-prairie-100 dark:bg-prairie-900/60 text-prairie-700 dark:text-prairie-300 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Sign In Required to Post
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            To prevent spam and keep Southwest Iowa listings trustworthy for neighbors, please log in or create a free account to publish a listing.
          </p>
          <div className="mt-6 space-y-2">
            <button
              onClick={onOpenAuth}
              className="w-full bg-prairie-600 hover:bg-prairie-500 text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all min-h-[44px]"
            >
              Sign In / Register
            </button>
            <button
              onClick={onCancel}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Return to Feed
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If free tier limit reached, prompt upgrade
  if (isLimitReached) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center">
        <div className="bg-white dark:bg-slate-800/90 border-2 border-amber-400 dark:border-amber-600 rounded-3xl p-6 sm:p-8 shadow-xl text-slate-800 dark:text-slate-100">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <h2 className="text-xl font-black">
            Free Tier Listing Limit Reached (1/1)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            The free community plan includes <strong>1 active listing</strong> at a time. Upgrade to <strong>Pro ($10/mo or $100/yr)</strong> to list unlimited rental units, contractor services, and get top-of-feed featured promotion!
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={onOpenPricing}
              className="bg-prairie-600 hover:bg-prairie-500 text-white font-bold py-3 px-6 rounded-xl text-xs shadow-md transition-all min-h-[44px] flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Upgrade to Pro ($10/mo)</span>
            </button>
            <button
              onClick={onCancel}
              className="border border-slate-300 dark:border-slate-700 py-3 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
            >
              Manage Existing Listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFinalSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Please provide a title and description.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const parsedPrice = priceCents ? Math.round(parseFloat(priceCents) * 100) : undefined;
      const parsedDeposit = depositCents ? Math.round(parseFloat(depositCents) * 100) : undefined;

      const newListingData: Partial<Listing> = {
        categoryType,
        town,
        title: title.trim(),
        description: description.trim(),
        address: address.trim() || undefined,
        priceCents: parsedPrice,
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || currentUser.email,
        status: 'active',
        isFeatured: isProOrAdmin ? isFeatured : false,

        // Rental
        bedrooms: categoryType === 'rental' ? bedrooms : undefined,
        bathrooms: categoryType === 'rental' ? bathrooms : undefined,
        depositCents: categoryType === 'rental' ? parsedDeposit : undefined,
        petsAllowed: categoryType === 'rental' ? petsAllowed : undefined,
        utilitiesIncluded: categoryType === 'rental' ? utilities : undefined,
        laundryType: categoryType === 'rental' ? laundryType : undefined,
        parkingType: categoryType === 'rental' ? parkingType : undefined,

        // Service
        emergencyAvailable: categoryType === 'service' ? emergencyAvailable : undefined,
        insured: categoryType === 'service' ? insured : undefined,
        freeEstimates: categoryType === 'service' ? freeEstimates : undefined,
        serviceRadiusMiles: categoryType === 'service' ? serviceRadiusMiles : undefined,
        serviceOfferings: categoryType === 'service' ? serviceOfferings : undefined,

        // Event
        eventDate: categoryType === 'event' ? eventDate : undefined,
        eventEndDate: categoryType === 'event' ? eventEndDate : undefined,
        locationVenue: categoryType === 'event' ? locationVenue : undefined,
        ticketUrl: categoryType === 'event' ? ticketUrl : undefined,
        isFree: categoryType === 'event' ? isFree : undefined,

        media: mediaList.map((m, idx) => ({
          id: m.id,
          listingId: '',
          r2Key: m.r2Key || `client-compressed-${m.id}.webp`,
          url: m.url || m.previewUrl,
          sortOrder: idx,
          isPrimary: idx === 0,
        })),

        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      };

      await onSubmit(newListingData);
    } catch (err: any) {
      setError(err.message || 'Failed to submit listing');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 pt-3 px-3 sm:px-6 text-slate-800 dark:text-slate-100">
      {/* Wizard Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={step === 1 ? onCancel : () => setStep((s) => ((s - 1) as any))}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[44px] shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{step === 1 ? 'Cancel' : 'Previous Step'}</span>
        </button>

        <div className="text-right">
          <span className="text-xs font-black text-prairie-700 dark:text-prairie-400">Step {step} of 4</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {step === 1 && 'Category & Town'}
            {step === 2 && 'Details & Pricing'}
            {step === 3 && 'Specifics & Amenities'}
            {step === 4 && 'Photos & Contact'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Category & Town */}
      {step === 1 && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-7 space-y-5 shadow-sm">
          <div>
            <h2 className="text-base font-black">What are you listing?</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select the directory category tailored for Southwest Iowa.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'rental', label: 'Rental Housing', icon: Home, desc: 'Apartment, house, room' },
              { type: 'service', label: 'Local Contractor', icon: Wrench, desc: 'Snow, plumbing, lawn' },
              { type: 'event', label: 'Community Event', icon: Calendar, desc: 'Festival, sports, dinner' },
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = categoryType === cat.type;
              return (
                <button
                  key={cat.type}
                  type="button"
                  onClick={() => setCategoryType(cat.type as any)}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between min-h-[96px] transition-all ${
                    isSelected
                      ? 'border-prairie-600 bg-prairie-50 dark:bg-prairie-900/30 ring-2 ring-prairie-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-prairie-600 dark:text-prairie-400' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-bold text-xs block mt-2">{cat.label}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{cat.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Southwest Iowa Town
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-prairie-600 pointer-events-none" />
              <select
                value={town}
                onChange={(e) => setTown(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold focus:border-prairie-500 outline-none min-h-[44px]"
              >
                {SW_IOWA_TOWNS.map((t) => (
                  <option key={t} value={t}>
                    {t}, Iowa
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full bg-prairie-600 hover:bg-prairie-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 min-h-[48px] shadow-sm transition-all"
          >
            <span>Continue to Details</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 2: Details & Pricing */}
      {step === 2 && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm">
          <div>
            <h2 className="text-base font-black">Listing Title & Overview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Be descriptive so neighbors quickly recognize what you offer.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder={
                categoryType === 'rental'
                  ? 'e.g. 2-Bed Duplex near McKinley Park with Garage'
                  : categoryType === 'service'
                  ? 'e.g. Reliable Snow Plowing & Driveway Salting'
                  : 'e.g. Creston Lions Club Benefit Pancake Breakfast'
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm focus:border-prairie-500 outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {categoryType === 'rental' ? 'Monthly Rent ($)' : categoryType === 'service' ? 'Starting Rate / Hourly ($)' : 'Admission / Ticket ($)'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs sm:text-sm">$</span>
              <input
                type="number"
                placeholder={categoryType === 'rental' ? '950' : categoryType === 'service' ? '50' : '0 (Free)'}
                value={priceCents}
                onChange={(e) => setPriceCents(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-7 pr-3 py-2 text-xs sm:text-sm focus:border-prairie-500 outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Street Address / Neighborhood <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 402 N Pine St"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm focus:border-prairie-500 outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Provide complete details, requirements, features, or hours of operation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm focus:border-prairie-500 outline-none"
            />
          </div>

          {/* Featured Option for Pro Users */}
          {isProOrAdmin && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 block">Pro Featured Placement</span>
                  <span className="text-[10px] text-amber-800 dark:text-amber-300">Pin this listing to the top of the town feed.</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-5 h-5 rounded text-amber-500"
              />
            </div>
          )}

          <button
            type="button"
            disabled={!title.trim() || !description.trim()}
            onClick={() => setStep(3)}
            className="w-full bg-prairie-600 disabled:opacity-50 hover:bg-prairie-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 min-h-[48px] shadow-sm transition-all"
          >
            <span>Continue to Specifics</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 3: Specifics & Amenities */}
      {step === 3 && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm">
          <h2 className="text-base font-black capitalize">{categoryType} Specific Details</h2>

          {categoryType === 'rental' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bedrooms</label>
                  <select
                    value={bedrooms}
                    onChange={(e) => setBedrooms(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-semibold min-h-[44px]"
                  >
                    {[0, 1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n === 0 ? 'Studio / Room' : `${n} Bedroom${n > 1 ? 's' : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bathrooms</label>
                  <select
                    value={bathrooms}
                    onChange={(e) => setBathrooms(parseFloat(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-xs sm:text-sm font-semibold min-h-[44px]"
                  >
                    {[1, 1.5, 2, 2.5, 3].map((n) => (
                      <option key={n} value={n}>
                        {n} Bath
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Security Deposit ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 950"
                  value={depositCents}
                  onChange={(e) => setDepositCents(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm min-h-[44px]"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="petsAllowed"
                  checked={petsAllowed}
                  onChange={(e) => setPetsAllowed(e.target.checked)}
                  className="w-5 h-5 rounded text-prairie-600"
                />
                <label htmlFor="petsAllowed" className="text-xs font-bold cursor-pointer">
                  🐾 Pets Allowed (Cats/Dogs permitted)
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Utilities Included in Rent
                </label>
                <div className="flex flex-wrap gap-2">
                  {['water', 'trash', 'electric', 'gas', 'internet'].map((u) => {
                    const active = utilities.includes(u);
                    return (
                      <button
                        key={u}
                        type="button"
                        onClick={() => toggleUtility(u)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border capitalize min-h-[36px] transition-colors ${
                          active
                            ? 'bg-prairie-600 border-prairie-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {active ? '✓ ' : '+ '} {u}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {categoryType === 'service' && (
            <div className="space-y-4">
              <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emergencyAvailable}
                  onChange={(e) => setEmergencyAvailable(e.target.checked)}
                  className="w-5 h-5 rounded text-red-600"
                />
                <div>
                  <span className="text-xs font-bold text-red-600 dark:text-red-400 block">24/7 Emergency Service</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Available for urgent snow storms, frozen pipes, or heating outages.</span>
                </div>
              </label>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={insured}
                    onChange={(e) => setInsured(e.target.checked)}
                    className="w-4 h-4 rounded text-prairie-600"
                  />
                  <span>Licensed & Insured</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                  <input
                    type="checkbox"
                    checked={freeEstimates}
                    onChange={(e) => setFreeEstimates(e.target.checked)}
                    className="w-4 h-4 rounded text-prairie-600"
                  />
                  <span>Free Estimates</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Radius: {serviceRadiusMiles} miles from {town}
                </label>
                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={serviceRadiusMiles}
                  onChange={(e) => setServiceRadiusMiles(parseInt(e.target.value, 10))}
                  className="w-full accent-prairie-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Service Tags (e.g. Snow Plowing, Gutter Cleaning)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add service tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 px-3 py-2 rounded-xl text-xs font-bold min-h-[44px]"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {serviceOfferings.map((tag) => (
                    <span
                      key={tag}
                      className="bg-prairie-100 dark:bg-prairie-900/60 text-prairie-800 dark:text-prairie-300 border border-prairie-200 dark:border-prairie-700 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => setServiceOfferings(serviceOfferings.filter((t) => t !== tag))}
                        className="text-prairie-600 hover:text-prairie-900 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {categoryType === 'event' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Venue / Location Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corning Opera House, McKinley Park"
                  value={locationVenue}
                  onChange={(e) => setLocationVenue(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ticket or Event Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={ticketUrl}
                  onChange={(e) => setTicketUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm min-h-[44px]"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setStep(4)}
            className="w-full bg-prairie-600 hover:bg-prairie-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 min-h-[48px] shadow-sm transition-all"
          >
            <span>Continue to Photos & Contact</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STEP 4: Photos, Contact & Submission */}
      {step === 4 && (
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 sm:p-7 space-y-4 shadow-sm">
          <div>
            <h2 className="text-base font-black">Photos & Fast Contact</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload photos with instant client-side WebP compression.
            </p>
          </div>

          <ImageUploader
            mediaList={mediaList}
            onChange={setMediaList}
            maxFiles={isProOrAdmin ? 8 : 3}
          />

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Contact Phone (for Call & SMS buttons)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="641-782-xxxx"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:border-prairie-500 outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Contact Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="youremail@example.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm focus:border-prairie-500 outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div className="p-3.5 bg-prairie-50 dark:bg-prairie-950/40 border border-prairie-200 dark:border-prairie-700/40 rounded-2xl text-xs text-prairie-800 dark:text-prairie-300 font-medium leading-relaxed">
            ✓ Your post will be active for <strong>30 days</strong>. You can renew, edit, or mark as Rented anytime in your Dashboard.
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleFinalSubmit}
            className="w-full bg-prairie-600 hover:bg-prairie-500 disabled:opacity-50 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 min-h-[48px] shadow-md transition-all active:scale-95"
          >
            {submitting ? (
              <span>Publishing to Southwest Iowa...</span>
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span>Publish Listing Now</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
