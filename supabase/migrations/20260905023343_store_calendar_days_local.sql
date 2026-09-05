-- Store "dateAcquired" / "dateSold" as calendar days, not UTC instants.
--
-- These columns are `timestamp without time zone`, and the app used to write
-- them with `.toISOString()`. That stored the *UTC* wall clock of a day the
-- user picked in their own timezone, with nothing recording the conversion, so
-- reads came back a day early: a Sydney user picking 6 Jul landed
-- `2026-07-05 14:00`. The app now writes the picked day at midnight (see
-- `src/lib/date.ts`); this migration realigns the rows written before that.
--
-- Every existing row was written from Australia/Sydney - it is the only
-- timezone this data has ever been entered from - so shifting by that zone
-- recovers the day the user meant.

-- 1. StockLot."dateAcquired" and Sale."dateSold": shift back to the local day.
--    Rows already sitting exactly on midnight were written by the AI-import and
--    CSV-restore paths, which always meant that literal day - skipping them
--    keeps this migration idempotent and leaves correct rows untouched.
UPDATE "StockLot"
SET "dateAcquired" = date_trunc(
      'day',
      "dateAcquired" AT TIME ZONE 'UTC' AT TIME ZONE 'Australia/Sydney'
    )
WHERE "dateAcquired" <> date_trunc('day', "dateAcquired");

UPDATE "Sale"
SET "dateSold" = date_trunc(
      'day',
      "dateSold" AT TIME ZONE 'UTC' AT TIME ZONE 'Australia/Sydney'
    )
WHERE "dateSold" <> date_trunc('day', "dateSold");

-- 2. Product."lastSoldAt" is a cached MAX() over Sale."dateSold", so it still
--    holds the pre-shift value and would disagree with the sales rows beneath
--    it. Recompute it the same way sync_product_sale_stats does.
UPDATE "Product" p
SET "lastSoldAt" = agg.latest
FROM (
  SELECT "productId", MAX(COALESCE("dateSold", "createdAt")) AS latest
  FROM "Sale"
  GROUP BY "productId"
) agg
WHERE p.id = agg."productId";

-- 3. Bundle."dateSold" was the odd one out as `timestamp with time zone`, so
--    bundle rows rendered in the viewer's timezone while sale rows rendered
--    verbatim. Bring it onto the same calendar-day footing. The USING clause
--    resolves each instant in Sydney first, so the day currently displayed is
--    the day that is kept.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Bundle'
      AND column_name = 'dateSold'
      AND data_type = 'timestamp with time zone'
  ) THEN
    ALTER TABLE "Bundle"
      ALTER COLUMN "dateSold" TYPE timestamp(3) without time zone
      USING date_trunc('day', "dateSold" AT TIME ZONE 'Australia/Sydney');
  END IF;
END $$;

-- 4. The combined sales feed unioned everything as `timestamp with time zone`,
--    which re-introduced the offset on the way out. Emit naive timestamps so
--    product, bundle, and sale rows all carry the same calendar day for every
--    viewer. `createdAt` is a genuine instant and only serves as a fallback, so
--    it keeps its UTC wall clock - matching Sale."createdAt", which is already
--    stored that way.
CREATE OR REPLACE FUNCTION public.get_combined_sales_paginated(
  p_user_id text,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 10,
  p_search text DEFAULT NULL::text,
  p_sort text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_page      integer := GREATEST(p_page, 1);
  v_page_size integer := GREATEST(LEAST(p_page_size, 100), 1);
  v_offset    integer := (v_page - 1) * v_page_size;
  v_search    text    := NULLIF(TRIM(p_search), '');
  v_sort      text    := COALESCE(p_sort, 'date_desc');
  v_result    json;
BEGIN
  WITH combined AS (
    SELECT
      'product'::text                            AS kind,
      p.id                                       AS id,
      p.name                                     AS name,
      p."lastSoldAt" AT TIME ZONE 'UTC'          AS effective_date,
      NULL::timestamp                            AS date_sold,
      NULL::timestamp                            AS created_at,
      p."totalUnitsSold"::numeric                AS total_quantity,
      (p."totalRevenue" - p."totalProfit")       AS total_buy,
      p."totalRevenue"                           AS total_sell,
      p."totalProfit"                            AS total_profit
    FROM "Product" p
    WHERE p."userId" = p_user_id
      AND p."lastSoldAt" IS NOT NULL
      AND (v_search IS NULL OR p.name ILIKE '%' || v_search || '%')
    UNION ALL
    SELECT
      'bundle'::text                             AS kind,
      b.id                                       AS id,
      b.name                                     AS name,
      COALESCE(b."dateSold", b."createdAt" AT TIME ZONE 'UTC')
                                                 AS effective_date,
      b."dateSold"                               AS date_sold,
      b."createdAt" AT TIME ZONE 'UTC'           AS created_at,
      COALESCE((
        SELECT SUM(bi."quantityConsumed")
        FROM "BundleItem" bi
        WHERE bi."bundleId" = b.id
      ), 0)::numeric                             AS total_quantity,
      b."totalBuyCost"                           AS total_buy,
      b."totalSellPrice"                         AS total_sell,
      b."totalProfit"                            AS total_profit
    FROM "Bundle" b
    WHERE b."userId" = p_user_id
      AND (v_search IS NULL OR b.name ILIKE '%' || v_search || '%')
  )
  SELECT json_build_object(
    'totalCount', (SELECT COUNT(*) FROM combined),
    'items', COALESCE((
      SELECT json_agg(json_build_object(
        'kind',          c.kind,
        'id',            c.id,
        'name',          c.name,
        'effectiveDate', c.effective_date,
        'dateSold',      c.date_sold,
        'createdAt',     c.created_at,
        'totalQuantity', c.total_quantity,
        'totalBuy',      c.total_buy,
        'totalSell',     c.total_sell,
        'totalProfit',   c.total_profit
      ))
      FROM (
        SELECT
          kind, id, name, effective_date, date_sold, created_at,
          total_quantity, total_buy, total_sell, total_profit
        FROM combined
        ORDER BY
          CASE WHEN v_sort = 'product_asc'   THEN LOWER(name) END ASC  NULLS LAST,
          CASE WHEN v_sort = 'product_desc'  THEN LOWER(name) END DESC NULLS LAST,
          CASE WHEN v_sort = 'quantity_asc'  THEN total_quantity END ASC  NULLS LAST,
          CASE WHEN v_sort = 'quantity_desc' THEN total_quantity END DESC NULLS LAST,
          CASE WHEN v_sort = 'buy_asc'       THEN total_buy END      ASC  NULLS LAST,
          CASE WHEN v_sort = 'buy_desc'      THEN total_buy END      DESC NULLS LAST,
          CASE WHEN v_sort = 'sell_asc'      THEN total_sell END     ASC  NULLS LAST,
          CASE WHEN v_sort = 'sell_desc'     THEN total_sell END     DESC NULLS LAST,
          CASE WHEN v_sort = 'profit_asc'    THEN total_profit END   ASC  NULLS LAST,
          CASE WHEN v_sort = 'profit_desc'   THEN total_profit END   DESC NULLS LAST,
          CASE WHEN v_sort = 'date_asc'      THEN effective_date END ASC  NULLS LAST,
          effective_date DESC NULLS LAST,
          id ASC
        LIMIT  v_page_size
        OFFSET v_offset
      ) c
    ), '[]'::json)
  )
  INTO v_result;

  RETURN v_result;
END;
$function$;
