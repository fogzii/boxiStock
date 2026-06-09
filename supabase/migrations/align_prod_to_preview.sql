-- Aligns production schema to match preview where they had drifted. Idempotent.
-- Target: prod only (preview already has the correct state for each item).
--
-- Drift items addressed:
--   1. Column defaults missing on prod (5 cols): Product.id, Product.updatedAt,
--      Sale.id, StockLot.id, StockLot.updatedAt. Without these, any INSERT that
--      omits the field fails on prod even though it works on preview.
--   2. FK ON UPDATE mismatch: Sale.productId and StockLot.productId reference
--      Product.id with ON UPDATE CASCADE on prod, NO ACTION on preview. Aligning
--      to NO ACTION (matches preview; Product.id is a UUID and should never change).
--   3. Dead 4-arg overload of public.get_inventory_paginated on prod. The 6-arg
--      version is the one in use; the 4-arg signature is unreferenced and clutter.

-- ─── 1. Missing column defaults ──────────────────────────────────────────────
ALTER TABLE "Product"  ALTER COLUMN "id"        SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "Product"  ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "Sale"     ALTER COLUMN "id"        SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "StockLot" ALTER COLUMN "id"        SET DEFAULT (gen_random_uuid())::text;
ALTER TABLE "StockLot" ALTER COLUMN "updatedAt" SET DEFAULT now();

-- ─── 2. FK ON UPDATE alignment ───────────────────────────────────────────────
ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_productId_fkey";
ALTER TABLE "Sale" ADD  CONSTRAINT "Sale_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "StockLot" DROP CONSTRAINT IF EXISTS "StockLot_productId_fkey";
ALTER TABLE "StockLot" ADD  CONSTRAINT "StockLot_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- ─── 3. Drop dead function overload ──────────────────────────────────────────
DROP FUNCTION IF EXISTS public.get_inventory_paginated(text, text, integer, integer);

NOTIFY pgrst, 'reload schema';
