# boxiStock — assistant instructions

See `prd.md` for product intent, tech stack, and visual direction.

## Interaction and affordances

- Any control that behaves like a **button**, **link**, or **click/tap target** MUST communicate that with **`cursor-pointer`** (Tailwind `className`) so hover matches intent. Applies to `<button>` (unless native `disabled`), role="button", card rows that navigate, icon-only controls, segmented toggles inside modals, etc.
- **Do not** add `cursor-pointer` to purely decorative elements or regions that should not imply clickability (e.g. modal backdrop intentionally uses neutral cursor where appropriate).
- **Disabled** interactive elements remain non-clickable (`disabled`, `pointer-events-none`, or `cursor-not-allowed` when the design calls for an explicit blocked state).

## Money and currency (two decimal places)

- **Invariant:** Monetary fields (buy price, sell price, totals, CSV-style amounts, etc.) must stay at **maximum two decimal places**. Users should never end up storing or displaying values with more fractional digits than cents.

- **Canonical rounding:** Normalize with **cent arithmetic**: `Math.round(n * 100) / 100`. Several places define a tiny helper **`round2(n)`** with that body (e.g. **`sellUnitsModal`**, **`bundleSaleModal`**, **`editBundleModal`**, **`ai-import/page.tsx`**). Prefer extracting or reusing **one shared helper** in `@/lib` if you touch multiple files—but when editing a single component, stay consistent with the pattern already inside that file.

- **Controlled inputs:** Use **`type="number"`**, **`min="0"`** (or whatever floor the field needs), **`step="0.01"`**. On **`onBlur`**, **`parseFloat`**, check **`Number.isFinite`**, then set state to **`(Math.round(n * 100) / 100).toFixed(2)`** so the visible value snaps to cents (see **`addProductModal`** `handleBuyPriceBlur`, **`addLotModal`** / **`editLotModal`**, **`editSaleModal`**).

- **On submit / mutation:** **`parseFloat`** then **`Math.round(parsed * 100) / 100`** before calling server actions (same as Quick Add / lot modals). Some flows also round in **server actions** (e.g. **`bulkAddSales`** in **`src/actions/stock.ts`** uses cent rounding on prices). **Preserve that double layer:** UI normalizes UX; actions still coerce so bad payloads cannot sneak in.

- **Bundles / linked fields:** **`sellUnitsModal`** keeps per-unit and total aligned with **`round2`** and `.toFixed(2)` after edits—when adding comparable “two amounts that stay in sync” inputs, mirror that behavior rather than raw floating division.

## Modals — match existing patterns

- Use the shared shell: **`src/components/ui/modal.tsx`** (`<Modal>`) for layout, backdrop, title row, close control, spacing, and motion.
- Before adding fields or tweaking typography, compare an established modal:

  **`src/components/stock/addProductModal.tsx`** (“Quick Add” in the sidebar; modal title **“Add Stock”**).

  Typical patterns used there:

  - Form wrapper: `className="flex flex-col gap-6"` on `<form>`; inner groups `space-y-5` / `space-y-2`.
  - **Labels**: `Label` with `className="text-muted-foreground"`.
  - **Text inputs**: `Input` with `className="bg-background/50 border-primary/20 h-11"` (and variants like currency `pl-7` where needed).
  - **Primary action**: full-width submit `Button` with `h-12`, bold text, optional shadow tokens consistent with existing modals; **secondary** Cancel as `variant="ghost"` with matching height and rounding.
  - **Segment / pill toggles** (e.g. status): bordered container plus inner buttons with **`cursor-pointer`** and `text-sm font-medium rounded-md`.

- New modals should look like sibling modals (**`addLotModal`**, **`editLotModal`**, **`AIImportModal`**, **`editSaleModal`**, **`bundleSaleModal`**) — same input height, label treatment, spacing, and border tokens — unless `prd.md` explicitly calls for something different.

## Date pickers

- Use **`react-date-picker`** (`import DatePicker from "react-date-picker"`), which is wired app-wide (**`react-date-picker/dist/DatePicker.css`** is imported from **`src/app/layout.tsx`**; theme overrides live in **`src/app/globals.css`** under `.react-date-picker*` / `.react-calendar*`).
- Reuse the same **compact “rect” inline field** as other modals, for example align with **`addProductModal`**: wrapper `flex w-full`, `clearIcon={null}` when elsewhere, and a `className` along the lines of:

  `w-full bg-background/50 dark:bg-input/30 border border-primary/20 h-11 rounded-md [color-scheme:dark] flex items-center text-sm`

- Avoid alternate calendar/date UI libraries unless there is a project-wide migration.

## Loading and async feedback

Whenever user-facing work depends on **network, server actions, or slow queries**:

- Prefer **`Skeleton`** from **`src/components/ui/skeleton.tsx`** for layout placeholders (lists, rows, charts, modal content that will hydrate).
- For **explicit actions** (submit, refresh, destructive confirm), use **`Button` disabled state**, swapped label text (e.g. “Adding…” / “Saving…”), and/or a **small spinner** (**`Loader2`** from `lucide-react` with `animate-spin`) in the trigger area — match patterns already used in modals or pages rather than introducing a second loading language.
- Do not leave UI **static with no clue** during multi-second operations; skeletons/spinners should cover the regions that depend on pending data.

## Supabase types

- Generated types live in **`src/lib/supabase/database.types.ts`** and are consumed by the server client in **`src/lib/supabase/server.ts`**.
- **Run `npm run db:types` after any schema change**: adding/removing/renaming a table or column, changing a column's type or nullability, adding an RPC function, enum, or view. This regenerates the file from the live database.
- Do not hand-edit `database.types.ts` — it will be overwritten on the next run.

## Code quality reminders

- Keep changes scoped; follow existing naming, Tailwind conventions, and client/server boundaries in the codebase.
- After editing TS/JS/TSX, run **`npm run check:fix`** (or project-standard format/lint scripts) rather than guessing formatting.
