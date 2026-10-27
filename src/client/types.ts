import type { SwIowaTown } from '../db/constants';

export type BillingTier = 'free' | 'pro_monthly' | 'pro_annual';
export type UserRole = 'user' | 'landlord' | 'business' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: BillingTier;
  image?: string | null;
}

export interface ListingMedia {
  id: string;
  listingId: string;
  r2Key: string;
  url: string;
  altText?: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface Listing {
  id: string;
  userId: string;
  categoryType: 'rental' | 'service' | 'event';
  categoryId?: string | null;
  title: string;
  slug: string;
  description: string;
  priceCents?: number | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  status: 'active' | 'pending' | 'rented' | 'expired' | 'hidden';
  isFeatured: boolean;

  // Location
  town: SwIowaTown | string;
  address?: string | null;
  serviceRadiusMiles?: number | null;
  zip?: string | null;

  // Rental specific
  bedrooms?: number | null;
  bathrooms?: number | null;
  depositCents?: number | null;
  petsAllowed?: boolean | null;
  utilitiesIncluded?: string[] | null;
  laundryType?: 'in_unit' | 'hookups' | 'shared' | 'none' | null;
  parkingType?: 'garage' | 'off_street' | 'street' | null;

  // Service specific
  emergencyAvailable?: boolean | null;
  insured?: boolean | null;
  freeEstimates?: boolean | null;
  serviceOfferings?: string[] | null;

  // Event specific
  eventDate?: string | null;
  eventEndDate?: string | null;
  locationVenue?: string | null;
  ticketUrl?: string | null;
  isFree?: boolean | null;

  // Timestamps
  expiresAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;

  // Attached media
  media?: ListingMedia[];
}

export interface ListingFilter {
  town?: string;
  categoryType?: 'rental' | 'service' | 'event' | '';
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  petsAllowed?: boolean;
  emergencyAvailable?: boolean;
  q?: string;
}

export interface Suggestion {
  id: string;
  type: 'new_listing' | 'edit_suggestion';
  listingId?: string | null;
  submitterName?: string | null;
  submitterEmail?: string | null;
  title: string;
  town?: string | null;
  categoryType?: 'rental' | 'service' | 'event' | null;
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string | Date;
}
