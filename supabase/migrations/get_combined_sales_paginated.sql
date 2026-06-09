-- Idempotent: combined Product + Bundle sales pagination/sort moved to Postgres
-- to avoid the previous "fetch everything, sort in JS, slice" approach. Returns
-- header rows only; the caller fetches per-page Sale + BundleItem detail rows.

CREATE OR REPLACE FUNCTION public.get_combined_sales_paginated(
  p_user_id   text,
  p_page      integer DEFAULT 1,
  p_page_size integer DEFAULT 10,
  p_search    text    DEFAULT NULL,
  p_sort      text    DEFAULT NULL
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
      p."lastSoldAt"                             AS effective_date,
      NULL::timestamp with time zone             AS date_sold,
      NULL::timestamp with time zone             AS created_at,
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
      COALESCE(b."dateSold", b."createdAt")      AS effective_date,
      b."dateSold"                               AS date_sold,
      b."createdAt"                              AS created_at,
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

GRANT EXECUTE ON FUNCTION public.get_combined_sales_paginated(text, integer, integer, text, text)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
