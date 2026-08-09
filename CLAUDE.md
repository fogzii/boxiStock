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
- **Run `npm run db:types` after any schema change** (table, column, RPC, enum, or view). Do not hand-edit the file.

## Database migrations

Both Supabase projects are live (preview/staging was resumed on 2026-08-09 after a short pause):

| Env | Name | Project ref | Region |
| --- | --- | --- | --- |
| Production | `boxiStock-sydney` | `euduypcktlvwvzoiomlv` | `ap-southeast-2` (Sydney) |
| Preview/staging | `boxistock-preview` | `uzsijodyaiooiroscfdx` | `ap-northeast-1` (Tokyo) |

Production moved from Tokyo (`idgpprtyleutgqinrouo`, now paused, kept for rollback) to Sydney on 2026-08-02, to co-locate with Vercel's `syd1` region.

- Apply schema changes to **staging first, then production** via `mcp__supabase__apply_migration` (or the CLI linked to the matching ref). Write migrations as **idempotent SQL** (`IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS`, `CREATE OR REPLACE`) so the same file applies cleanly to both.
- After creating a **new table**, reload PostgREST so the REST API sees it: `NOTIFY pgrst, 'reload schema';`.
- Regenerate types: **`npm run db:types`** (defaults to production) or **`npm run db:types:preview`** for staging.
- **`.env.local` (local dev)** points at PREVIEW.

## Deployment

- **Staging:** `git push origin HEAD:staging` — triggers a Vercel deploy to **staging.boxistock.au**.
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
