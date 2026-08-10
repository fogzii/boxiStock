-- Projected profit support.
--
-- 1. Adds Product."sellPrice" — a per-unit target sell price. NULL means "not
--    set" and the UI renders it as NA. It is deliberately never coerced to 0 so
--    unpriced products stay out of projected-profit totals instead of dragging
--    them down.
-- 2. Backfills that column from sales history, matched by product name.
-- 3. Exposes sellPrice through get_inventory_paginated.
-- 4. Adds get_projected_profit for the dashboard card.
-- 5. Adds per-link "showProjectedProfit" flags, defaulting to false so existing
--    share links do not start leaking margins to viewers.
--
-- Idempotent: safe to re-run against preview and production.

-- 1. Column ------------------------------------------------------------------

alter table public."Product"
  add column if not exists "sellPrice" numeric(12, 2);

comment on column public."Product"."sellPrice" is
  'Per-unit projected sell price. NULL = not set (renders as NA in the UI).';

-- 2. Backfill from sales history ---------------------------------------------
-- Lowest per-unit price the item has ever sold for, matched by name (case
-- insensitive) within a single user. Products with no sales stay NULL.
-- Only fills rows that have never been priced, so re-running never clobbers a
-- value the user set by hand.

with unit_prices as (
  select
    p."userId"              as user_id,
    lower(p.name)           as name_key,
    round((s."totalSalePrice" / s."quantitySold")::numeric, 2) as unit_price
  from public."Product" p
  join public."Sale" s on s."productId" = p.id
  where s."quantitySold" > 0
),
lowest as (
  select user_id, name_key, min(unit_price) as lowest_unit_price
  from unit_prices
  group by user_id, name_key
)
update public."Product" p
set "sellPrice" = lowest.lowest_unit_price
from lowest
where lowest.user_id = p."userId"
  and lowest.name_key = lower(p.name)
  and p."sellPrice" is null;

-- 2b. Seed new products the same way --------------------------------------
-- Products get created from several paths (manual add, bulk import, CSV
-- restore, AI import). Seeding in a BEFORE INSERT trigger keeps all of them
-- consistent with the backfill above, and avoids a per-row lookup in the bulk
-- paths. Only fires when sellPrice was not supplied, and only on insert — so
-- a user who deliberately clears the price back to NA keeps it that way.

create or replace function public.seed_product_sell_price()
returns trigger
language plpgsql
as $function$
begin
  if new."sellPrice" is null then
    select min(round((s."totalSalePrice" / s."quantitySold")::numeric, 2))
    into new."sellPrice"
    from public."Product" p
    join public."Sale" s on s."productId" = p.id
    where p."userId" = new."userId"
      and lower(p.name) = lower(new.name)
      and s."quantitySold" > 0;
  end if;
  return new;
end;
$function$;

drop trigger if exists product_seed_sell_price on public."Product";
create trigger product_seed_sell_price
  before insert on public."Product"
  for each row execute function public.seed_product_sell_price();

-- 3. Inventory RPC ------------------------------------------------------------
-- Two changes:
--   a) Expose sellPrice on each product row.
--   b) Apply p_status to the lots themselves, not just to which products match.
--      Previously the status predicate lived only in the EXISTS clause that
--      selected products, so "In Stock" returned every lot of any product that
--      happened to have one in-stock lot — pending lots included. The per-lot
--      predicate below makes the filter mean what it says.
--
-- The sort aggregate gets the same predicate. Without it, sorting by stock or
-- value under the "Pending" filter ranks every row by its in-stock total, which
-- is zero for the products that filter returns.

CREATE OR REPLACE FUNCTION public.get_inventory_paginated(p_user_id text, p_search text DEFAULT NULL::text, p_page integer DEFAULT 1, p_page_size integer DEFAULT 10, p_sort text DEFAULT NULL::text, p_status text DEFAULT 'all'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_page      integer := GREATEST(p_page, 1);
  v_page_size integer := GREATEST(LEAST(p_page_size, 100), 1);
  v_offset    integer := (v_page - 1) * v_page_size;
  v_search    text    := NULLIF(TRIM(p_search), '');
  v_sort      text    := COALESCE(p_sort, '');
  v_status    text    := COALESCE(p_status, 'all');
  v_total     bigint;
  v_products  json;
BEGIN
  SELECT COUNT(DISTINCT p.id)
  INTO v_total
  FROM "Product" p
  WHERE p."userId" = p_user_id
    AND (v_search IS NULL OR p.name ILIKE '%' || v_search || '%')
    AND EXISTS (
      SELECT 1 FROM "StockLot" sl
      WHERE sl."productId" = p.id
        AND sl."remainingQuantity" > 0
        AND (
          v_status = 'all'
          OR (v_status = 'stocked' AND sl."isStocked" = true)
          OR (v_status = 'pending' AND sl."isStocked" = false)
        )
    );

  SELECT COALESCE(json_agg(row_data), '[]'::json)
  INTO v_products
  FROM (
    SELECT json_build_object(
      'id',        p.id,
      'name',      p.name,
      'sellPrice', p."sellPrice",
      'lots', (
        SELECT COALESCE(json_agg(json_build_object(
          'id',                sl.id,
          'initialQuantity',   sl."initialQuantity",
          'remainingQuantity', sl."remainingQuantity",
          'buyPrice',          sl."buyPrice",
          'isStocked',         sl."isStocked",
          'dateAcquired',      sl."dateAcquired",
          'lotIdentity',       sl."lotIdentity",
          'notes',             sl.notes
        ) ORDER BY sl."dateAcquired" ASC), '[]'::json)
        FROM "StockLot" sl
        WHERE sl."productId" = p.id
          AND sl."remainingQuantity" > 0
          AND (
            v_status = 'all'
            OR (v_status = 'stocked' AND sl."isStocked" = true)
            OR (v_status = 'pending' AND sl."isStocked" = false)
          )
      )
    ) AS row_data
    FROM "Product" p
    LEFT JOIN LATERAL (
      SELECT
        COALESCE(SUM(sl."remainingQuantity") FILTER (WHERE sl."isStocked" = true), 0)               AS total_stock,
        COALESCE(SUM(sl."remainingQuantity" * sl."buyPrice") FILTER (WHERE sl."isStocked" = true), 0) AS total_value
      FROM "StockLot" sl
      WHERE sl."productId" = p.id
        AND sl."remainingQuantity" > 0
        AND (
          v_status = 'all'
          OR (v_status = 'stocked' AND sl."isStocked" = true)
          OR (v_status = 'pending' AND sl."isStocked" = false)
        )
    ) agg ON true
    WHERE p."userId" = p_user_id
      AND (v_search IS NULL OR p.name ILIKE '%' || v_search || '%')
      AND EXISTS (
        SELECT 1 FROM "StockLot" sl
        WHERE sl."productId" = p.id
          AND sl."remainingQuantity" > 0
          AND (
            v_status = 'all'
            OR (v_status = 'stocked' AND sl."isStocked" = true)
            OR (v_status = 'pending' AND sl."isStocked" = false)
          )
      )
    ORDER BY
      CASE WHEN v_sort = 'name_asc'   THEN p.name END ASC,
      CASE WHEN v_sort = 'name_desc'  THEN p.name END DESC,
      CASE WHEN v_sort = 'stock_asc'  THEN agg.total_stock END ASC,
      CASE WHEN v_sort = 'stock_desc' THEN agg.total_stock END DESC,
      CASE WHEN v_sort = 'value_asc'  THEN agg.total_value END ASC,
      CASE WHEN v_sort = 'value_desc' THEN agg.total_value END DESC,
      p."updatedAt" DESC
    LIMIT  v_page_size
    OFFSET v_offset
  ) sub;

  RETURN json_build_object(
    'totalCount', v_total,
    'products',   COALESCE(v_products, '[]'::json)
  );
END;
$function$;

-- 4. Dashboard projected-profit total ----------------------------------------
-- Sum of every product's projected profit. Products with no sell price are
-- excluded entirely rather than counted as zero.
--
-- Covers every lot still holding units, received or on order — the same basis
-- as the stock table's Total Stock / Total Value and as
-- get_dashboard_metrics.currentInventoryValue, so all of them describe the same
-- pile of stock.
--
-- Summing (sellPrice - buyPrice) * qty lot by lot is identical to
-- sellPrice * totalQty - totalCost, so the weighted-average buy price the UI
-- shows per unit stays consistent with this total.

CREATE OR REPLACE FUNCTION public.get_projected_profit(p_user_id text)
 RETURNS numeric
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT COALESCE(
    ROUND(SUM((p."sellPrice" - sl."buyPrice") * sl."remainingQuantity")::numeric, 2),
    0
  )
  FROM "Product" p
  JOIN "StockLot" sl ON sl."productId" = p.id
  WHERE p."userId" = p_user_id
    AND p."sellPrice" IS NOT NULL
    AND sl."remainingQuantity" > 0;
$function$;

GRANT EXECUTE ON FUNCTION public.get_projected_profit(text)
  TO anon, authenticated, service_role;

-- 5. Sharing flags ------------------------------------------------------------
-- Two independent opt-ins, both defaulting to false so no existing link starts
-- exposing anything new:
--   showSellPrice       — the per-unit price you intend to sell at.
--   showProjectedProfit — the margin, on the stock table and dashboard.
-- They share one swappable column in the UI, but are separate permissions: a
-- customer can reasonably be shown your asking price without being shown what
-- you make on it.

alter table public."ShareLink"
  add column if not exists "showProjectedProfit" boolean not null default false;
alter table public."ShareLink"
  add column if not exists "showSellPrice" boolean not null default false;

alter table public."ShareInvite"
  add column if not exists "showProjectedProfit" boolean not null default false;
alter table public."ShareInvite"
  add column if not exists "showSellPrice" boolean not null default false;

comment on column public."ShareLink"."showProjectedProfit" is
  'Whether this link exposes projected profit. Defaults to false.';
comment on column public."ShareLink"."showSellPrice" is
  'Whether this link exposes the per-unit sell price. Defaults to false.';
comment on column public."ShareInvite"."showProjectedProfit" is
  'Whether this invitee sees projected profit. Defaults to false.';
comment on column public."ShareInvite"."showSellPrice" is
  'Whether this invitee sees the per-unit sell price. Defaults to false.';

NOTIFY pgrst, 'reload schema';
