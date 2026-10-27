-- Seed Categories
INSERT OR IGNORE INTO `categories` (`id`, `type`, `name`, `slug`, `icon`) VALUES
('cat-rent-apt', 'rental', 'Apartments & Condos', 'apartments-condos', 'Building'),
('cat-rent-house', 'rental', 'Single Family Houses', 'houses', 'Home'),
('cat-rent-room', 'rental', 'Rooms & Shared Housing', 'rooms', 'Users'),
('cat-rent-commercial', 'rental', 'Commercial & Storefronts', 'commercial', 'Store'),
('cat-serv-snow', 'service', 'Snow Removal', 'snow-removal', 'Snowflake'),
('cat-serv-lawn', 'service', 'Mowing & Yard Care', 'lawn-care', 'Flower2'),
('cat-serv-plumb', 'service', 'Plumbing & Heating', 'plumbing', 'Wrench'),
('cat-serv-elec', 'service', 'Electrical & Handyman', 'electrical', 'Zap'),
('cat-serv-roof', 'service', 'Roofing & Gutters', 'roofing', 'Hammer'),
('cat-serv-hauling', 'service', 'Hauling & Junk Removal', 'hauling', 'Truck'),
('cat-ev-fest', 'event', 'Festivals & Fairs', 'festivals', 'PartyPopper'),
('cat-ev-sports', 'event', 'School & Youth Sports', 'sports', 'Trophy'),
('cat-ev-market', 'event', 'Farmers Markets & Sales', 'markets', 'ShoppingBag'),
('cat-ev-church', 'event', 'Community Dinners & Benefit', 'community-dinners', 'Heart');

-- Seed Demo Users
INSERT OR IGNORE INTO `users` (`id`, `name`, `email`, `role`, `tier`, `created_at`, `updated_at`) VALUES
('user-demo-1', 'Creston Property Partners', 'creston.rentals@prairiemail.com', 'landlord', 'pro_annual', unixepoch(), unixepoch()),
('user-demo-2', 'Adams County Housing', 'corningliving@iowamail.net', 'landlord', 'pro_monthly', unixepoch(), unixepoch()),
('user-contractor-1', 'Corn Belt Snow & Earthworks', 'dispatch@cornbeltsnow.com', 'business', 'pro_annual', unixepoch(), unixepoch()),
('user-contractor-2', 'Prairie Edge Mechanical', 'service@prairieedgeplumbing.com', 'business', 'pro_annual', unixepoch(), unixepoch()),
('user-event-1', 'Corning Opera House Guild', 'tickets@corningoperahouse.com', 'user', 'free', unixepoch(), unixepoch()),
('user-event-2', 'Afton Volunteer Fire Dept', 'community@aftonfire.org', 'user', 'free', unixepoch(), unixepoch());

-- Seed Listings
INSERT OR IGNORE INTO `listings` (
  `id`, `user_id`, `category_type`, `category_id`, `title`, `slug`, `description`, `price_cents`,
  `contact_phone`, `contact_email`, `status`, `is_featured`, `town`, `address`, `zip`,
  `bedrooms`, `bathrooms`, `deposit_cents`, `pets_allowed`, `utilities_included`, `laundry_type`, `parking_type`,
  `emergency_available`, `insured`, `free_estimates`, `service_radius_miles`, `service_offerings`,
  `event_date`, `event_end_date`, `location_venue`, `ticket_url`, `is_free`, `expires_at`, `created_at`, `updated_at`
) VALUES
(
  'sample-rent-1', 'user-demo-1', 'rental', 'cat-rent-house',
  'Remodeled 3-Bed Ranch House near Creston High School', 'remodeled-3-bed-ranch-house-creston',
  'Spacious 3 bedroom, 2 bath single-family home with fenced yard and attached 2-car garage. Features updated kitchen with quartz countertops, central AC, and washer/dryer hookups. Walking distance to Creston High and McKinley Park.',
  115000, '641-782-5501', 'creston.rentals@prairiemail.com', 'active', 1, 'Creston', '804 W Montgomery St', '50801',
  3, 2.0, 115000, 1, '["water", "trash"]', 'hookups', 'garage',
  0, 0, 0, NULL, NULL,
  NULL, NULL, NULL, NULL, 1,
  unixepoch() + 2592000, unixepoch() - 172800, unixepoch()
),
(
  'sample-rent-2', 'user-demo-2', 'rental', 'cat-rent-apt',
  'Historic Corning Square 2-Bedroom Loft Apartment', 'corning-square-loft-apartment',
  'Charming 2-bed upper level loft with exposed brick walls, tall ceilings, and scenic views of the Corning town square. Steps away from the Corning Opera House and local bakeries. Water and high-speed internet included.',
  85000, '641-322-4412', 'corningliving@iowamail.net', 'active', 0, 'Corning', '710 Davis Ave', '50841',
  2, 1.0, 85000, 0, '["water", "internet", "trash"]', 'in_unit', 'off_street',
  0, 0, 0, NULL, NULL,
  NULL, NULL, NULL, NULL, 1,
  unixepoch() + 2592000, unixepoch() - 345600, unixepoch()
),
(
  'sample-serv-1', 'user-contractor-1', 'service', 'cat-serv-snow',
  '24/7 Southwest Iowa Snow Removal & De-Icing Crew', '24-7-sw-iowa-snow-removal',
  'Commercial & residential snow plowing, snow blowing, sidewalk clearing, and salt spreading. Fast emergency response for driveways, farm lanes, and parking lots in Creston, Afton, and Corning. Fully insured commercial grade plow trucks.',
  NULL, '641-782-9900', 'dispatch@cornbeltsnow.com', 'active', 1, 'Creston', NULL, '50801',
  NULL, NULL, NULL, 0, NULL, NULL, NULL,
  1, 1, 1, 30, '["Commercial Lot Plowing", "Driveway Clearing", "Sidewalk Salting", "Farm Lane Plowing"]',
  NULL, NULL, NULL, NULL, 1,
  unixepoch() + 2592000, unixepoch() - 86400, unixepoch()
),
(
  'sample-serv-2', 'user-contractor-2', 'service', 'cat-serv-plumb',
  'Prairie Edge Plumbing & HVAC - Emergency Drain & Furnace Repair', 'prairie-edge-plumbing-hvac',
  'Licensed master plumber and heating technician serving Greenfield, Creston, Winterset, and surrounding rural routes. Frozen pipe thawing, furnace repair, water heater replacement, and drain snaking.',
  NULL, '641-743-8100', 'service@prairieedgeplumbing.com', 'active', 1, 'Greenfield', NULL, '50849',
  NULL, NULL, NULL, 0, NULL, NULL, NULL,
  1, 1, 1, 35, '["Emergency Furnace Repair", "Water Heater Replacement", "Frozen Pipes", "Drain Cleaning"]',
  NULL, NULL, NULL, NULL, 1,
  unixepoch() + 2592000, unixepoch() - 259200, unixepoch()
),
(
  'sample-ev-1', 'user-event-1', 'event', 'cat-ev-fest',
  'Southwest Iowa Winter Blues & Acoustic Showcase', 'sw-iowa-winter-blues-showcase',
  'An evening of live folk and blues featuring regional Iowa songwriters at the historic Corning Opera House. Refreshments and local craft beverages available. Family friendly!',
  1500, '641-322-4521', 'tickets@corningoperahouse.com', 'active', 1, 'Corning', NULL, '50841',
  NULL, NULL, NULL, 0, NULL, NULL, NULL,
  0, 0, 0, NULL, NULL,
  '2026-11-14T19:00:00', '2026-11-14T22:30:00', 'Corning Opera House (800 Davis Ave)', 'https://corningoperahouse.com', 0,
  unixepoch() + 2592000, unixepoch() - 432000, unixepoch()
),
(
  'sample-ev-2', 'user-event-2', 'event', 'cat-ev-market',
  'Union County Community Pancake Breakfast & Bake Sale', 'union-county-pancake-breakfast',
  'Annual benefit pancake breakfast supporting local volunteer emergency responders. All-you-can-eat pancakes, sausage, scrambled eggs, and orange juice. Free will donation welcome.',
  0, '641-347-8822', 'community@aftonfire.org', 'active', 0, 'Afton', NULL, '50830',
  NULL, NULL, NULL, 0, NULL, NULL, NULL,
  0, 0, 0, NULL, NULL,
  '2026-11-08T07:30:00', '2026-11-08T11:00:00', 'Afton Community Center', NULL, 1,
  unixepoch() + 2592000, unixepoch() - 172800, unixepoch()
);

-- Seed Media for Listings
INSERT OR IGNORE INTO `listing_media` (`id`, `listing_id`, `r2_key`, `url`, `alt_text`, `sort_order`, `is_primary`) VALUES
('med-1', 'sample-rent-1', 'sample/house-1.jpg', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80', 'Creston Ranch House Exterior', 0, 1),
('med-2', 'sample-rent-1', 'sample/kitchen-1.jpg', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80', 'Remodeled Kitchen', 1, 0),
('med-3', 'sample-rent-2', 'sample/loft-1.jpg', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', 'Corning Loft Interior', 0, 1),
('med-4', 'sample-serv-1', 'sample/snowplow.jpg', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80', 'Commercial Snowplow Crew', 0, 1),
('med-5', 'sample-serv-2', 'sample/plumbing.jpg', 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1200&q=80', 'Prairie Edge Service Van & Tools', 0, 1),
('med-6', 'sample-ev-1', 'sample/opera-house.jpg', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', 'Corning Opera House Concert', 0, 1),
('med-7', 'sample-ev-2', 'sample/pancakes.jpg', 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=1200&q=80', 'Community Pancake Breakfast', 0, 1);
