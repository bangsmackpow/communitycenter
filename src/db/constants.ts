export const SW_IOWA_TOWNS = [
  'Creston',
  'Corning',
  'Afton',
  'Greenfield',
  'Osceola',
  'Red Oak',
  'Shenandoah',
  'Clarinda',
  'Atlantic',
  'Mount Ayr',
  'Lenox',
  'Bedford',
  'Villisca',
  'Winterset',
] as const;

export type SwIowaTown = (typeof SW_IOWA_TOWNS)[number];

export const DEFAULT_CATEGORIES = [
  // Rentals
  { id: 'cat-rent-apt', type: 'rental', name: 'Apartments & Condos', slug: 'apartments-condos', icon: 'Building' },
  { id: 'cat-rent-house', type: 'rental', name: 'Single Family Houses', slug: 'houses', icon: 'Home' },
  { id: 'cat-rent-room', type: 'rental', name: 'Rooms & Shared Housing', slug: 'rooms', icon: 'Users' },
  { id: 'cat-rent-commercial', type: 'rental', name: 'Commercial & Storefronts', slug: 'commercial', icon: 'Store' },

  // Services
  { id: 'cat-serv-snow', type: 'service', name: 'Snow Removal', slug: 'snow-removal', icon: 'Snowflake' },
  { id: 'cat-serv-lawn', type: 'service', name: 'Mowing & Yard Care', slug: 'lawn-care', icon: 'Flower2' },
  { id: 'cat-serv-plumb', type: 'service', name: 'Plumbing & Heating', slug: 'plumbing', icon: 'Wrench' },
  { id: 'cat-serv-elec', type: 'service', name: 'Electrical & Handyman', slug: 'electrical', icon: 'Zap' },
  { id: 'cat-serv-roof', type: 'service', name: 'Roofing & Gutters', slug: 'roofing', icon: 'Hammer' },
  { id: 'cat-serv-hauling', type: 'service', name: 'Hauling & Junk Removal', slug: 'hauling', icon: 'Truck' },

  // Events
  { id: 'cat-ev-fest', type: 'event', name: 'Festivals & Fairs', slug: 'festivals', icon: 'PartyPopper' },
  { id: 'cat-ev-sports', type: 'event', name: 'School & Youth Sports', slug: 'sports', icon: 'Trophy' },
  { id: 'cat-ev-market', type: 'event', name: 'Farmers Markets & Sales', slug: 'markets', icon: 'ShoppingBag' },
  { id: 'cat-ev-church', type: 'event', name: 'Community Dinners & Benefit', slug: 'community-dinners', icon: 'Heart' },
] as const;
