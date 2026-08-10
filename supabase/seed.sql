-- Local dev seed data. Runs automatically after `supabase db reset` (or the
-- first `supabase start` on a fresh volume). Not applied to preview/production.
--
-- Test logins (password for both: Testing123*)
--   test@gmail.com  - 10 products / 20 stock lots / 20 sales / 1 bundle
--   test1@gmail.com - 5 products / 10 stock lots / 10 sales
--
-- Mix covered: in-stock lots, pending lots, sold-out lots (remainingQuantity
-- 0), products with a sellPrice set vs. null (null -> no projected profit),
-- sales spread across several months with and without notes.

-- Auth users --------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'test@gmail.com', crypt('Testing123*', gen_salt('bf')),
   now(), now(), '{"provider":"email","providers":["email"]}', '{}',
   now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'test1@gmail.com', crypt('Testing123*', gen_salt('bf')),
   now(), now(), '{"provider":"email","providers":["email"]}', '{}',
   now(), now(), '', '', '', '');

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"test@gmail.com"}', 'email', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   '{"sub":"22222222-2222-2222-2222-222222222222","email":"test1@gmail.com"}', 'email', now(), now(), now());

-- ============================================================
-- Account 1: test@gmail.com
-- ============================================================

insert into "Product" (id, "userId", name, "sellPrice") values
  ('a1-camera',   '11111111-1111-1111-1111-111111111111', 'Vintage Camera',      149.99),
  ('a1-speaker',  '11111111-1111-1111-1111-111111111111', 'Bluetooth Speaker',    45.00),
  ('a1-wallet',   '11111111-1111-1111-1111-111111111111', 'Leather Wallet',       NULL),
  ('a1-lamp',     '11111111-1111-1111-1111-111111111111', 'Desk Lamp',            29.99),
  ('a1-keyboard', '11111111-1111-1111-1111-111111111111', 'Mechanical Keyboard',  89.99),
  ('a1-yogamat',  '11111111-1111-1111-1111-111111111111', 'Yoga Mat',             NULL),
  ('a1-mugset',   '11111111-1111-1111-1111-111111111111', 'Ceramic Mug Set',      24.50),
  ('a1-shoes',    '11111111-1111-1111-1111-111111111111', 'Running Shoes',        79.99),
  ('a1-backpack', '11111111-1111-1111-1111-111111111111', 'Backpack',             59.99),
  ('a1-charger',  '11111111-1111-1111-1111-111111111111', 'Wireless Charger',     NULL);

insert into "StockLot" (id, "productId", "initialQuantity", "remainingQuantity", "buyPrice", "isStocked", "lotIdentity") values
  ('a1-lot-camera-1',   'a1-camera',   10, 10, 60.00, true,  'Batch A'),
  ('a1-lot-camera-2',   'a1-camera',    5,  5, 65.00, false, 'On order'),
  ('a1-lot-speaker-1',  'a1-speaker',  20, 12, 18.00, true,  'Batch A'),
  ('a1-lot-speaker-2',  'a1-speaker',  10,  0, 20.00, true,  'Batch B'),
  ('a1-lot-wallet-1',   'a1-wallet',   15, 15, 12.00, true,  'Batch A'),
  ('a1-lot-wallet-2',   'a1-wallet',   10, 10, 13.00, false, 'Pending shipment'),
  ('a1-lot-lamp-1',     'a1-lamp',      8,  3,  9.00, true,  'Batch A'),
  ('a1-lot-lamp-2',     'a1-lamp',      8,  8,  9.50, true,  'Batch B'),
  ('a1-lot-keyboard-1', 'a1-keyboard',  6,  6, 40.00, true,  'Batch A'),
  ('a1-lot-keyboard-2', 'a1-keyboard',  4,  4, 42.00, false, 'On order'),
  ('a1-lot-yogamat-1',  'a1-yogamat',  25, 20,  7.00, true,  'Batch A'),
  ('a1-lot-yogamat-2',  'a1-yogamat',  15,  0,  7.50, true,  'Batch B'),
  ('a1-lot-mugset-1',   'a1-mugset',   30, 30,  5.00, false, 'Pending shipment'),
  ('a1-lot-mugset-2',   'a1-mugset',   20, 10,  5.50, true,  'Batch B'),
  ('a1-lot-shoes-1',    'a1-shoes',    12,  4, 35.00, true,  'Batch A'),
  ('a1-lot-shoes-2',    'a1-shoes',     8,  8, 37.00, false, 'On order'),
  ('a1-lot-backpack-1', 'a1-backpack', 10, 10, 22.00, true,  'Batch A'),
  ('a1-lot-backpack-2', 'a1-backpack',  5,  0, 24.00, true,  'Batch B'),
  ('a1-lot-charger-1',  'a1-charger',  40, 25,  6.00, true,  'Batch A'),
  ('a1-lot-charger-2',  'a1-charger',  20, 20,  6.50, false, 'Pending shipment');

insert into "Sale" (id, "productId", "quantitySold", "totalSalePrice", "totalProfit", "dateSold", notes) values
  ('a1-sale-01', 'a1-camera',   2, 299.98, 179.98, '2026-05-15', NULL),
  ('a1-sale-02', 'a1-camera',   1, 149.99,  89.99, '2026-06-02', NULL),
  ('a1-sale-03', 'a1-speaker',  5, 225.00, 135.00, '2026-04-10', 'Etsy'),
  ('a1-sale-04', 'a1-speaker',  3, 135.00,  81.00, '2026-07-01', NULL),
  ('a1-sale-05', 'a1-wallet',   3,  45.00,  21.00, '2026-03-20', NULL),
  ('a1-sale-06', 'a1-wallet',   2,  30.00,  14.00, '2026-03-25', 'Local pickup'),
  ('a1-sale-07', 'a1-lamp',     2,  59.98,  29.98, '2026-06-15', NULL),
  ('a1-sale-08', 'a1-lamp',     3,  89.97,  44.97, '2026-07-10', NULL),
  ('a1-sale-09', 'a1-keyboard', 2, 179.98,  99.98, '2026-02-14', 'eBay'),
  ('a1-sale-10', 'a1-yogamat', 10, 200.00, 130.00, '2026-05-01', NULL),
  ('a1-sale-11', 'a1-yogamat', 10, 190.00, 117.50, '2026-05-20', NULL),
  ('a1-sale-12', 'a1-yogamat',  5, 100.00,  62.50, '2026-06-05', NULL),
  ('a1-sale-13', 'a1-mugset',  10, 245.00, 195.00, '2026-04-18', NULL),
  ('a1-sale-14', 'a1-mugset',  10, 240.00, 190.00, '2026-07-22', NULL),
  ('a1-sale-15', 'a1-shoes',    4, 319.96, 179.96, '2026-03-11', 'Facebook Marketplace'),
  ('a1-sale-16', 'a1-shoes',    4, 319.96, 179.96, '2026-06-30', NULL),
  ('a1-sale-17', 'a1-backpack', 5, 299.95, 189.95, '2026-01-25', NULL),
  ('a1-sale-18', 'a1-backpack', 5, 299.95, 189.95, '2026-07-05', NULL),
  ('a1-sale-19', 'a1-charger', 10, 599.90, 359.90, '2026-05-08', NULL),
  ('a1-sale-20', 'a1-charger',  5, 299.95, 179.95, '2026-07-28', 'Amazon');

select sync_product_sale_stats(id) from "Product" where "userId" = '11111111-1111-1111-1111-111111111111';

insert into "Bundle" (id, "userId", name, "totalSellPrice", "totalBuyCost", "totalProfit", "dateSold") values
  ('a1-bundle-starter', '11111111-1111-1111-1111-111111111111', 'Starter pack', 45.00, 20.00, 25.00, now());

insert into "BundleItem" (id, "bundleId", "productId", "productName", "lotId", "quantityConsumed", "buyPricePerUnit", "totalBuyCost") values
  ('a1-bundleitem-1', 'a1-bundle-starter', 'a1-camera', 'Vintage Camera', 'a1-lot-camera-1', 1, 60.00, 60.00),
  ('a1-bundleitem-2', 'a1-bundle-starter', 'a1-lamp',   'Desk Lamp',      'a1-lot-lamp-2',   1,  9.50,  9.50);

-- ============================================================
-- Account 2: test1@gmail.com
-- ============================================================

insert into "Product" (id, "userId", name, "sellPrice") values
  ('a2-boardgame', '22222222-2222-2222-2222-222222222222', 'Board Game',     34.99),
  ('a2-succulent', '22222222-2222-2222-2222-222222222222', 'Succulent Pot',  NULL),
  ('a2-notebook',  '22222222-2222-2222-2222-222222222222', 'Notebook Set',   14.99),
  ('a2-phonecase', '22222222-2222-2222-2222-222222222222', 'Phone Case',     19.99),
  ('a2-bottle',    '22222222-2222-2222-2222-222222222222', 'Water Bottle',   NULL);

insert into "StockLot" (id, "productId", "initialQuantity", "remainingQuantity", "buyPrice", "isStocked", "lotIdentity") values
  ('a2-lot-boardgame-1', 'a2-boardgame', 12, 12, 20.00, true,  'Batch A'),
  ('a2-lot-boardgame-2', 'a2-boardgame',  6,  6, 21.00, false, 'On order'),
  ('a2-lot-succulent-1', 'a2-succulent', 30, 18,  3.00, true,  'Batch A'),
  ('a2-lot-succulent-2', 'a2-succulent', 15,  0,  3.20, true,  'Batch B'),
  ('a2-lot-notebook-1',  'a2-notebook',  25, 25,  6.00, true,  'Batch A'),
  ('a2-lot-notebook-2',  'a2-notebook',  10, 10,  6.50, false, 'Pending shipment'),
  ('a2-lot-phonecase-1', 'a2-phonecase', 50, 30,  4.00, true,  'Batch A'),
  ('a2-lot-phonecase-2', 'a2-phonecase', 20,  5,  4.50, true,  'Batch B'),
  ('a2-lot-bottle-1',    'a2-bottle',    40, 40,  2.50, false, 'Pending shipment'),
  ('a2-lot-bottle-2',    'a2-bottle',    20, 10,  2.75, true,  'Batch B');

insert into "Sale" (id, "productId", "quantitySold", "totalSalePrice", "totalProfit", "dateSold", notes) values
  ('a2-sale-01', 'a2-boardgame',  3, 104.97,  44.97, '2026-04-05', NULL),
  ('a2-sale-02', 'a2-boardgame',  2,  69.98,  29.98, '2026-06-12', NULL),
  ('a2-sale-03', 'a2-succulent', 10,  60.00,  30.00, '2026-05-02', 'Farmers market'),
  ('a2-sale-04', 'a2-succulent',  5,  30.00,  15.00, '2026-06-20', NULL),
  ('a2-sale-05', 'a2-notebook',  10, 149.90,  89.90, '2026-03-15', NULL),
  ('a2-sale-06', 'a2-notebook',   5,  74.95,  44.95, '2026-07-01', 'Bulk order'),
  ('a2-sale-07', 'a2-phonecase', 15, 299.85, 149.85, '2026-02-28', NULL),
  ('a2-sale-08', 'a2-phonecase', 10, 199.90,  99.90, '2026-07-18', NULL),
  ('a2-sale-09', 'a2-bottle',    20, 100.00,  50.00, '2026-04-22', NULL),
  ('a2-sale-10', 'a2-bottle',    10,  50.00,  25.00, '2026-06-08', 'Gift bundle');

select sync_product_sale_stats(id) from "Product" where "userId" = '22222222-2222-2222-2222-222222222222';
