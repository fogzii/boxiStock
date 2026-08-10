-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE FUNCTION public.find_user_id_by_email (
  p_email text
)
  RETURNS text
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  SELECT id::text
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.find_user_id_by_email(text) FROM PUBLIC;

GRANT ALL ON FUNCTION public.find_user_id_by_email(text) TO anon;

GRANT ALL ON FUNCTION public.find_user_id_by_email(text) TO authenticated;

GRANT ALL ON FUNCTION public.find_user_id_by_email(text) TO service_role;

CREATE FUNCTION public.get_combined_sales_paginated (
  p_user_id   text,
  p_page      integer DEFAULT 1,
  p_page_size integer DEFAULT 10,
  p_search    text    DEFAULT NULL::text,
  p_sort      text    DEFAULT NULL::text
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

GRANT ALL ON FUNCTION public.get_combined_sales_paginated(text, integer, integer, text, text) TO anon;

GRANT ALL ON FUNCTION public.get_combined_sales_paginated(text, integer, integer, text, text) TO authenticated;

GRANT ALL ON FUNCTION public.get_combined_sales_paginated(text, integer, integer, text, text) TO service_role;

CREATE FUNCTION public.get_dashboard_metrics (
  p_user_id text
)
  RETURNS json
  LANGUAGE sql
  STABLE
  AS $function$
  SELECT json_build_object(
    'totalLifetimeProfit',
      COALESCE((
        SELECT SUM(s."totalProfit")
        FROM "Sale" s JOIN "Product" p ON p.id = s."productId"
        WHERE p."userId" = p_user_id
      ), 0)
      +
      COALESCE((
        SELECT SUM(b."totalProfit")
        FROM "Bundle" b
        WHERE b."userId" = p_user_id
      ), 0),

    'currentInventoryValue',
      COALESCE((
        SELECT SUM(l."remainingQuantity" * l."buyPrice")
        FROM "StockLot" l JOIN "Product" p ON p.id = l."productId"
        WHERE p."userId" = p_user_id
      ), 0),

    'totalSoldCost',
      COALESCE((
        SELECT SUM(s."totalSalePrice" - s."totalProfit")
        FROM "Sale" s JOIN "Product" p ON p.id = s."productId"
        WHERE p."userId" = p_user_id
      ), 0)
      +
      COALESCE((
        SELECT SUM(b."totalBuyCost")
        FROM "Bundle" b
        WHERE b."userId" = p_user_id
      ), 0)
  );
$function$;

GRANT ALL ON FUNCTION public.get_dashboard_metrics(text) TO anon;

GRANT ALL ON FUNCTION public.get_dashboard_metrics(text) TO authenticated;

GRANT ALL ON FUNCTION public.get_dashboard_metrics(text) TO service_role;

CREATE FUNCTION public.get_inventory_paginated (
  p_user_id   text,
  p_search    text    DEFAULT NULL::text,
  p_page      integer DEFAULT 1,
  p_page_size integer DEFAULT 10,
  p_sort      text    DEFAULT NULL::text,
  p_status    text    DEFAULT 'all'::text
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

GRANT ALL ON FUNCTION public.get_inventory_paginated(text, text, integer, integer, text, text) TO anon;

GRANT ALL ON FUNCTION public.get_inventory_paginated(text, text, integer, integer, text, text) TO authenticated;

GRANT ALL ON FUNCTION public.get_inventory_paginated(text, text, integer, integer, text, text) TO service_role;

CREATE FUNCTION public.get_inventory_value_by_status (
  p_user_id text,
  p_status  text DEFAULT 'all'::text
)
  RETURNS numeric
  LANGUAGE sql
  STABLE
  AS $function$
  SELECT COALESCE(
    SUM(l."remainingQuantity" * l."buyPrice"),
    0
  )
  FROM "StockLot" l
  JOIN "Product" p ON p.id = l."productId"
  WHERE p."userId" = p_user_id
    AND (
      p_status = 'all'
      OR (p_status = 'stocked'  AND l."isStocked" = true)
      OR (p_status = 'pending'  AND l."isStocked" = false)
    )
$function$;

GRANT ALL ON FUNCTION public.get_inventory_value_by_status(text, text) TO anon;

GRANT ALL ON FUNCTION public.get_inventory_value_by_status(text, text) TO authenticated;

GRANT ALL ON FUNCTION public.get_inventory_value_by_status(text, text) TO service_role;

CREATE FUNCTION public.get_projected_profit (
  p_user_id text
)
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

GRANT ALL ON FUNCTION public.get_projected_profit(text) TO anon;

GRANT ALL ON FUNCTION public.get_projected_profit(text) TO authenticated;

GRANT ALL ON FUNCTION public.get_projected_profit(text) TO service_role;

CREATE FUNCTION public.get_sales_by_month (
  p_user_id text
)
  RETURNS TABLE (
    year         integer,
    month        integer,
    total_profit numeric
  )
  LANGUAGE sql
  STABLE
  AS $function$
  SELECT year, month, SUM(profit)::numeric AS total_profit
  FROM (
    SELECT
      EXTRACT(YEAR  FROM COALESCE(s."dateSold"::date, s."createdAt"::date))::int AS year,
      EXTRACT(MONTH FROM COALESCE(s."dateSold"::date, s."createdAt"::date))::int AS month,
      s."totalProfit" AS profit
    FROM "Sale" s
    JOIN "Product" p ON p.id = s."productId"
    WHERE p."userId" = p_user_id

    UNION ALL

    SELECT
      EXTRACT(YEAR  FROM COALESCE(b."dateSold"::date, b."createdAt"::date))::int AS year,
      EXTRACT(MONTH FROM COALESCE(b."dateSold"::date, b."createdAt"::date))::int AS month,
      b."totalProfit" AS profit
    FROM "Bundle" b
    WHERE b."userId" = p_user_id
  ) combined
  GROUP BY year, month
  ORDER BY year, month;
$function$;

GRANT ALL ON FUNCTION public.get_sales_by_month(text) TO anon;

GRANT ALL ON FUNCTION public.get_sales_by_month(text) TO authenticated;

GRANT ALL ON FUNCTION public.get_sales_by_month(text) TO service_role;

CREATE FUNCTION public.seed_product_sell_price()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
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

GRANT ALL ON FUNCTION public.seed_product_sell_price() TO anon;

GRANT ALL ON FUNCTION public.seed_product_sell_price() TO authenticated;

GRANT ALL ON FUNCTION public.seed_product_sell_price() TO service_role;

CREATE FUNCTION public.sync_product_sale_stats (
  p_product_id text
)
  RETURNS void
  LANGUAGE sql
  AS $function$
  UPDATE "Product"
  SET
    "totalRevenue"   = COALESCE(agg.rev, 0),
    "totalProfit"    = COALESCE(agg.profit, 0),
    "totalUnitsSold" = COALESCE(agg.units, 0),
    "saleCount"      = COALESCE(agg.cnt, 0),
    "lastSoldAt"     = agg.latest
  FROM (
    SELECT
      SUM("totalSalePrice")                                        AS rev,
      SUM("totalProfit")                                           AS profit,
      SUM("quantitySold")                                          AS units,
      COUNT(*)                                                     AS cnt,
      MAX(COALESCE("dateSold"::timestamp, "createdAt"::timestamp)) AS latest
    FROM "Sale"
    WHERE "productId" = p_product_id
  ) agg
  WHERE "id" = p_product_id;
$function$;

GRANT ALL ON FUNCTION public.sync_product_sale_stats(text) TO anon;

GRANT ALL ON FUNCTION public.sync_product_sale_stats(text) TO authenticated;

GRANT ALL ON FUNCTION public.sync_product_sale_stats(text) TO service_role;

CREATE TABLE public."Bundle" (
  id               text                     DEFAULT (gen_random_uuid())::text NOT NULL,
  "userId"         text                     NOT NULL,
  name             text                     NOT NULL,
  "totalSellPrice" numeric(15,2)            NOT NULL,
  "totalBuyCost"   numeric(15,2)            NOT NULL,
  "totalProfit"    numeric(15,2)            NOT NULL,
  "dateSold"       timestamp with time zone,
  "createdAt"      timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public."Bundle"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."Bundle"
  ADD CONSTRAINT "Bundle_pkey" PRIMARY KEY (id);

GRANT ALL ON public."Bundle" TO anon;

GRANT ALL ON public."Bundle" TO authenticated;

GRANT ALL ON public."Bundle" TO service_role;

CREATE TABLE public."BundleItem" (
  id                 text                     DEFAULT (gen_random_uuid())::text NOT NULL,
  "bundleId"         text                     NOT NULL,
  "productId"        text,
  "productName"      text                     NOT NULL,
  "lotId"            text,
  "quantityConsumed" integer                  NOT NULL,
  "buyPricePerUnit"  numeric(15,2)            NOT NULL,
  "totalBuyCost"     numeric(15,2)            NOT NULL,
  "createdAt"        timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public."BundleItem"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."BundleItem"
  ADD CONSTRAINT "BundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES public."Bundle"(id) ON DELETE CASCADE;

ALTER TABLE public."BundleItem"
  ADD CONSTRAINT "BundleItem_pkey" PRIMARY KEY (id);

GRANT ALL ON public."BundleItem" TO anon;

GRANT ALL ON public."BundleItem" TO authenticated;

GRANT ALL ON public."BundleItem" TO service_role;

CREATE TABLE public."Product" (
  id               text                           DEFAULT (gen_random_uuid())::text NOT NULL,
  "userId"         text                           NOT NULL,
  name             text                           NOT NULL,
  "createdAt"      timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"      timestamp(3) without time zone DEFAULT now() NOT NULL,
  "lastSoldAt"     timestamp with time zone,
  "totalRevenue"   numeric(12,2)                  DEFAULT 0 NOT NULL,
  "totalProfit"    numeric(12,2)                  DEFAULT 0 NOT NULL,
  "totalUnitsSold" integer                        DEFAULT 0 NOT NULL,
  "saleCount"      integer                        DEFAULT 0 NOT NULL,
  "sellPrice"      numeric(12,2)
);

COMMENT ON COLUMN public."Product"."sellPrice" IS 'Per-unit projected sell price. NULL = not set (renders as NA in the UI).';

ALTER TABLE public."Product"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."Product"
  ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);

ALTER TABLE public."BundleItem"
  ADD CONSTRAINT "BundleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON DELETE SET NULL;

GRANT ALL ON public."Product" TO anon;

GRANT ALL ON public."Product" TO authenticated;

GRANT ALL ON public."Product" TO service_role;

CREATE INDEX idx_product_user_id ON public."Product" ("userId");

CREATE INDEX "idx_product_userId_lastSoldAt" ON public."Product" ("userId", "lastSoldAt" DESC NULLS LAST);

CREATE TRIGGER product_seed_sell_price
  BEFORE INSERT ON public."Product"
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_product_sell_price();

CREATE TABLE public."Sale" (
  id               text                           DEFAULT (gen_random_uuid())::text NOT NULL,
  "productId"      text                           NOT NULL,
  "quantitySold"   integer                        NOT NULL,
  "totalSalePrice" double precision               NOT NULL,
  "totalProfit"    double precision               NOT NULL,
  "dateSold"       timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "createdAt"      timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  notes            character varying(75)
);

ALTER TABLE public."Sale"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."Sale"
  ADD CONSTRAINT "Sale_pkey" PRIMARY KEY (id);

ALTER TABLE public."Sale"
  ADD CONSTRAINT "Sale_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON DELETE CASCADE;

GRANT ALL ON public."Sale" TO anon;

GRANT ALL ON public."Sale" TO authenticated;

GRANT ALL ON public."Sale" TO service_role;

CREATE INDEX "idx_sale_productId_date" ON public."Sale" ("productId", "dateSold" DESC NULLS LAST, "createdAt" DESC);

CREATE INDEX idx_sale_product_id ON public."Sale" ("productId");

CREATE TABLE public."ShareInvite" (
  id                    uuid                     DEFAULT gen_random_uuid() NOT NULL,
  "ownerId"             text                     NOT NULL,
  "inviteeId"           text                     NOT NULL,
  "inviteeEmail"        text                     NOT NULL,
  status                text                     DEFAULT 'pending'::text NOT NULL,
  "createdAt"           timestamp with time zone DEFAULT now() NOT NULL,
  "respondedAt"         timestamp with time zone,
  sections              text[]                   DEFAULT ARRAY['dashboard'::text,
  'stock'::text,
  'sales'::text] NOT NULL,
  "showStockAmounts"    boolean                  DEFAULT true NOT NULL,
  "showProjectedProfit" boolean                  DEFAULT false NOT NULL,
  "showSellPrice"       boolean                  DEFAULT false NOT NULL
);

COMMENT ON COLUMN public."ShareInvite"."showProjectedProfit" IS 'Whether this invitee sees projected profit. Defaults to false.';

COMMENT ON COLUMN public."ShareInvite"."showSellPrice" IS 'Whether this invitee sees the per-unit sell price. Defaults to false.';

ALTER TABLE public."ShareInvite"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."ShareInvite"
  ADD CONSTRAINT "ShareInvite_owner_invitee_key" UNIQUE ("ownerId", "inviteeId");

ALTER TABLE public."ShareInvite"
  ADD CONSTRAINT "ShareInvite_pkey" PRIMARY KEY (id);

ALTER TABLE public."ShareInvite"
  ADD CONSTRAINT "ShareInvite_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text]));

GRANT ALL ON public."ShareInvite" TO anon;

GRANT ALL ON public."ShareInvite" TO authenticated;

GRANT ALL ON public."ShareInvite" TO service_role;

CREATE INDEX "ShareInvite_ownerId_idx" ON public."ShareInvite" ("ownerId");

CREATE INDEX "ShareInvite_inviteeId_idx" ON public."ShareInvite" ("inviteeId");

CREATE TABLE public."ShareLink" (
  id                    uuid                     DEFAULT gen_random_uuid() NOT NULL,
  "userId"              text                     NOT NULL,
  token                 text                     NOT NULL,
  sections              text[]                   NOT NULL,
  "passwordHash"        text,
  "expiresAt"           timestamp with time zone,
  "isActive"            boolean                  DEFAULT true NOT NULL,
  "createdAt"           timestamp with time zone DEFAULT now() NOT NULL,
  visibility            text                     DEFAULT 'everyone'::text NOT NULL,
  label                 text,
  "showStockAmounts"    boolean                  DEFAULT true NOT NULL,
  "showProjectedProfit" boolean                  DEFAULT false NOT NULL,
  "showSellPrice"       boolean                  DEFAULT false NOT NULL
);

COMMENT ON COLUMN public."ShareLink"."showProjectedProfit" IS 'Whether this link exposes projected profit. Defaults to false.';

COMMENT ON COLUMN public."ShareLink"."showSellPrice" IS 'Whether this link exposes the per-unit sell price. Defaults to false.';

ALTER TABLE public."ShareLink"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."ShareLink"
  ADD CONSTRAINT "ShareLink_pkey" PRIMARY KEY (id);

ALTER TABLE public."ShareLink"
  ADD CONSTRAINT "ShareLink_token_key" UNIQUE (token);

ALTER TABLE public."ShareLink"
  ADD CONSTRAINT "ShareLink_visibility_check" CHECK (visibility = ANY (ARRAY['everyone'::text, 'invite_only'::text]));

GRANT ALL ON public."ShareLink" TO anon;

GRANT ALL ON public."ShareLink" TO authenticated;

GRANT ALL ON public."ShareLink" TO service_role;

CREATE UNIQUE INDEX "ShareLink_userId_invite_only_key" ON public."ShareLink" ("userId")
  WHERE visibility = 'invite_only'::text;

CREATE INDEX "ShareLink_userId_visibility_idx" ON public."ShareLink" ("userId", visibility);

CREATE TABLE public."StockLot" (
  id                  text                           DEFAULT (gen_random_uuid())::text NOT NULL,
  "productId"         text                           NOT NULL,
  "initialQuantity"   integer                        NOT NULL,
  "remainingQuantity" integer                        NOT NULL,
  "buyPrice"          double precision               NOT NULL,
  "isStocked"         boolean                        DEFAULT false NOT NULL,
  "dateAcquired"      timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "createdAt"         timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt"         timestamp(3) without time zone DEFAULT now() NOT NULL,
  "lotIdentity"       text,
  notes               character varying(75)
);

ALTER TABLE public."StockLot"
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."StockLot"
  ADD CONSTRAINT "StockLot_pkey" PRIMARY KEY (id);

ALTER TABLE public."BundleItem"
  ADD CONSTRAINT "BundleItem_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES public."StockLot"(id) ON DELETE SET NULL;

ALTER TABLE public."StockLot"
  ADD CONSTRAINT "StockLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON DELETE CASCADE;

GRANT ALL ON public."StockLot" TO anon;

GRANT ALL ON public."StockLot" TO authenticated;

GRANT ALL ON public."StockLot" TO service_role;

CREATE INDEX idx_stocklot_product_id ON public."StockLot" ("productId");
