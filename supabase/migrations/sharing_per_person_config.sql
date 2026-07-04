-- Sharing refinement: per-person invite config + multiple public links.
-- Idempotent — safe to run repeatedly and on both Supabase projects.

-- 1) ShareLink gains a label and a stock-$ visibility flag.
ALTER TABLE "ShareLink" ADD COLUMN IF NOT EXISTS "label" text;
ALTER TABLE "ShareLink"
  ADD COLUMN IF NOT EXISTS "showStockAmounts" boolean NOT NULL DEFAULT true;

-- 2) Allow multiple public links per user: drop UNIQUE(userId, visibility).
--    Constraint name is unknown across envs, so find it in the catalog.
DO $$
DECLARE
  con record;
BEGIN
  FOR con IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'ShareLink'
      AND c.contype = 'u'
      AND (
        SELECT array_agg(a.attname ORDER BY a.attname)
        FROM unnest(c.conkey) AS k(attnum)
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
      ) = ARRAY['userId', 'visibility']::name[]
  LOOP
    EXECUTE format('ALTER TABLE "ShareLink" DROP CONSTRAINT %I', con.conname);
  END LOOP;
END $$;

-- Invite-only links stay singular per user.
CREATE UNIQUE INDEX IF NOT EXISTS "ShareLink_userId_invite_only_key"
  ON "ShareLink" ("userId")
  WHERE visibility = 'invite_only';

-- Non-unique lookup index replacing the dropped constraint's index.
CREATE INDEX IF NOT EXISTS "ShareLink_userId_visibility_idx"
  ON "ShareLink" ("userId", "visibility");

-- 3) Per-person invite config. Nullable-first so re-runs never clobber
--    values edited after the initial backfill.
ALTER TABLE "ShareInvite" ADD COLUMN IF NOT EXISTS "sections" text[];
ALTER TABLE "ShareInvite" ADD COLUMN IF NOT EXISTS "showStockAmounts" boolean;

-- Backfill sections from the owner's invite-only link (the config that
-- governed every invitee before this migration), defaulting to all sections.
UPDATE "ShareInvite" i
SET "sections" = COALESCE(
  (
    SELECT l."sections"
    FROM "ShareLink" l
    WHERE l."userId" = i."ownerId" AND l."visibility" = 'invite_only'
    LIMIT 1
  ),
  ARRAY['dashboard', 'stock', 'sales']
)
WHERE i."sections" IS NULL;

UPDATE "ShareInvite"
SET "showStockAmounts" = true
WHERE "showStockAmounts" IS NULL;

ALTER TABLE "ShareInvite"
  ALTER COLUMN "sections" SET DEFAULT ARRAY['dashboard', 'stock', 'sales'],
  ALTER COLUMN "sections" SET NOT NULL;
ALTER TABLE "ShareInvite"
  ALTER COLUMN "showStockAmounts" SET DEFAULT true,
  ALTER COLUMN "showStockAmounts" SET NOT NULL;

NOTIFY pgrst, 'reload schema';
