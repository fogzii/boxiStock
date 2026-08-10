# boxiStock — assistant instructions

## Design system

**Always read `DESIGN.md` before any UI or visual work.** It is the single source of truth for:
- Color tokens (`primary`, `canvas`, `canvas-soft`, semantic families, etc.)
- Typography scale and font family (Manrope for display and body)
- Spacing, border radius, and elevation levels
- Component patterns (buttons, cards, badges, inputs, modals, data tables)

When building or modifying any UI, resolve tokens from DESIGN.md rather than hard-coding values.

## Interaction and affordances

- Any control that behaves like a **button**, **link**, or **click/tap target** MUST have **`cursor-pointer`** so hover matches intent. Applies to `<button>` (unless native `disabled`), `role="button"`, card rows that navigate, icon-only controls, segmented toggles inside modals, etc.
- **Do not** add `cursor-pointer` to purely decorative elements or non-clickable regions.
- **Disabled** interactive elements: use `disabled`, `pointer-events-none`, or `cursor-not-allowed` as appropriate.

## Money and currency (two decimal places)

- **Invariant:** Monetary fields must stay at **maximum two decimal places**. Never store or display more fractional digits than cents.
- **Canonical rounding:** `Math.round(n * 100) / 100`. Several files define a `round2(n)` helper with that body (e.g. `sellUnitsModal`, `bundleSaleModal`, `editBundleModal`, `ai-import/page.tsx`). Reuse or share via `@/lib` if touching multiple files.
- **Controlled inputs:** `type="number"`, `min="0"`, `step="0.01"`. On `onBlur`: `parseFloat` → `Number.isFinite` check → set state to `(Math.round(n * 100) / 100).toFixed(2)`.
- **On submit / mutation:** `parseFloat` then `Math.round(parsed * 100) / 100` before calling server actions. Preserve the double layer — UI normalizes UX; server actions coerce so bad payloads cannot sneak in.
- **Linked fields:** when two amounts must stay in sync (e.g. per-unit + total), use `round2` + `.toFixed(2)` on every edit — see `sellUnitsModal` for the pattern.

## Modals — implementation patterns

- Use **`src/components/ui/modal.tsx`** (`<Modal>`) for layout, backdrop, title row, close control, spacing, and motion.
- Reference **`src/components/stock/addProductModal.tsx`** as the canonical implementation example. Key patterns:
  - Form: `className="flex flex-col gap-6"`; inner groups `space-y-5` / `space-y-2`.
  - Labels: `Label` with `className="text-muted-foreground"`.
  - Inputs: `Input` component; currency fields add `pl-7` prefix.
  - Primary action: full-width submit `Button` with `h-12`; Cancel as `variant="ghost"` with matching height.
- For visual appearance (colors, radius, spacing), follow DESIGN.md — not the inline classNames from existing modals, which predate the design system.

## Date pickers

- Use **`react-date-picker`** (`import DatePicker from "react-date-picker"`). Vendor CSS is imported in `src/app/layout.tsx`; theme overrides live in `src/app/globals.css` under `.react-date-picker*` / `.react-calendar*`.
- Reuse the compact inline field pattern from `addProductModal`: wrapper `flex w-full`, `clearIcon={null}`, height/border aligned with other inputs.
- Do not introduce alternate calendar libraries.

## Loading and async feedback

- **Skeletons:** use `Skeleton` from `src/components/ui/skeleton.tsx` for layout placeholders.
- **Action feedback:** disable the trigger `Button`, swap label text ("Adding…" / "Saving…"), and/or add a `Loader2` spinner (`animate-spin` from `lucide-react`).
- Never leave UI static during multi-second operations.

## Supabase types

- Generated types: **`src/lib/supabase/database.types.ts`**, consumed by **`src/lib/supabase/server.ts`**.
- After a schema change that is already on **production**: **`npm run db:types`** (or `db:types:prod`).
- After a schema change that exists **only on local** so far: **`npm run db:types:local`**.
- Do not hand-edit the types file. **`db:types:preview` is gone** - the preview project is disabled permanently.

## Database migrations — local first, then production

**`boxistock-preview` was disabled by the user on 2026-08-10.** Treat it as gone. Only production is live; local Supabase CLI is the test environment.

| Env | Name | Project ref | Region |
| --- | --- | --- | --- |
| Production | `boxiStock-sydney` | `euduypcktlvwvzoiomlv` | `ap-southeast-2` (Sydney) |
| ~~Preview/staging~~ (disabled 2026-08-10) | `boxistock-preview` | `uzsijodyaiooiroscfdx` | `ap-northeast-1` (Tokyo) |
| Local (CLI) | Docker via `supabase start` | n/a | `http://127.0.0.1:54321` |

### How assistants / humans must change schema

1. **Create** a migration with the CLI so the filename is valid:
   `npx supabase migration new short_description`
   → `supabase/migrations/YYYYMMDDHHMMSS_short_description.sql`
2. Write **idempotent** SQL (`IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`, `CREATE OR REPLACE`).
3. **Apply locally** (do this before touching production):
   - Prefer: `npm run db:migrate` (`supabase migration up`), or just `npm run dev` - `predev` runs `scripts/ensure-supabase.sh`, which starts local Supabase if needed **and then runs `migration up`**.
   - Clean slate + seed: `npm run db:reset` (destructive).
4. Verify the app against local (`.env.local` → `http://127.0.0.1:54321`).
5. **Then** apply to production via `mcp__supabase__apply_migration` or the linked CLI (`supabase link --project-ref euduypcktlvwvzoiomlv` if needed). Never auto-push schema to prod from `predev`.
6. Regenerate types (`db:types:local` while iterating; `db:types` after prod has the change).
7. After a **new table**, reload PostgREST: `NOTIFY pgrst, 'reload schema';`.

**Filename rule:** only `YYYYMMDDHHMMSS_name.sql` is applied by the CLI. Legacy ad-hoc files (`align_prod_to_preview.sql`, `get_combined_sales_paginated.sql`, `sharing_per_person_config.sql`) are skipped - reference only, safe to delete.

### Local stack notes

- `npm run dev` → `predev` → `bash scripts/ensure-supabase.sh` (Docker health checks, start if down, then `migration up`). Do not put Supabase startup on the `start` script (`next start` for production builds must stay Docker-free).
- Seed logins (`supabase/seed.sql`, applied on `db reset` / first start): `test@gmail.com` / `Testing123*` and `test1@gmail.com` / same password.
- `.env.local.example` has deterministic local Supabase URL/keys; copy to `.env.local` and fill third-party secrets.
- For occasional cloud-only testing (webhooks, share links, phones), use Supabase branching on production and tear the branch down after.
- Local Next CSP must allow `http://127.0.0.1:54321` / `http://localhost:54321` (and matching `ws://`) in `connect-src` during development, or browser auth fails with `TypeError: Failed to fetch`.

## Deployment

- **Staging:** `git push origin HEAD:staging` - triggers a Vercel deploy to **staging.boxistock.au**, but this will fail/misbehave now that the staging Supabase project is disabled, not just paused (see migrations section above).
- **Production:** `git push origin HEAD:main` (or merge staging → main) — only when the user explicitly asks to ship to prod. Production is **boxistock.au**.
- **Never** use `vercel deploy` or `npx vercel deploy` from the CLI. Always go through git so the correct environment URL is used.

# Chrome DevTools MCP

Attach to the user's running Chrome with `--autoConnect` (Chrome 144+). Enable
remote debugging once per session at `chrome://inspect/#remote-debugging`, then
Accept the prompt. Do not combine `--autoConnect` with `--executablePath`.

MCP config is per machine (`~/.cursor/mcp.json`). On macOS use normal
`npx … --autoConnect`. On Windows+WSL run the MCP via `cmd.exe` so it sees
Windows Chrome (WSL Node only finds the Linux profile).


## Code quality

- Keep changes scoped; follow existing naming, Tailwind conventions, and client/server boundaries.
- After editing TS/JS/TSX, run **`npm run check:fix`**.
