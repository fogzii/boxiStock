"use client";

import { RollingNumber, Skeleton } from "@box-ds";
import { Menu, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  headerOverlapReserve,
  pageContainer,
} from "@/components/layout/pageContainer";
import { useSidebar } from "@/components/layout/SidebarContext";
import { cn } from "@/lib/utils";

export interface PageHeaderStat {
  label: string;
  value: string;
}

interface PageHeaderProps {
  title: string;
  stats?: PageHeaderStat[];
  /**
   * Renders `count` stat skeletons in place of `stats`. Used by the loading
   * fallback so the header keeps its final height and the content below it
   * doesn't jump when the real numbers arrive.
   */
  statsLoading?: number;
  /**
   * Reserves extra space below the stats for a `PageBody overlap` card to rise
   * into, so that card straddles the header edge.
   */
  overlap?: boolean;
  /** Controls for the title row, placed left of the settings icon. */
  actions?: React.ReactNode;
  /** Controls pinned to the right of the stats band. */
  bandActions?: React.ReactNode;
  /**
   * Alignment of the stat cells. `center` suits a row of equal metrics;
   * `start` suits a single headline figure paired with `bandActions`.
   */
  statsAlign?: "center" | "start";
}

// Explicit per-count classes — Tailwind only emits classes it can see as
// complete strings, so these can't be built by interpolation.
//
// The 4-up switch is a container query, not `lg:`. At a 1024px viewport the
// main column is only 768px, which left ~5px of slack per cell — enough that
// any cell padding clipped the values. Keying off the container both gives
// 4-up a width where it actually fits and lets it turn on earlier when the
// sidebar is collapsed.
const statColumns: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-1 @min-[700px]:grid-cols-3",
  4: "grid-cols-2 @min-[900px]:grid-cols-4",
};

export function PageHeader({
  title,
  stats,
  statsLoading,
  overlap,
  actions,
  bandActions,
  statsAlign = "center",
}: PageHeaderProps) {
  const { toggleMobile } = useSidebar();
  const pathname = usePathname();

  const statCount = stats?.length ?? statsLoading ?? 0;
  const hasStatsBand = statCount > 0;
  const statsGridClassName = cn(
    "grid gap-x-6 gap-y-8",
    statColumns[statCount] ?? "grid-cols-2 lg:grid-cols-4",
  );
  const bandClassName = cn(
    // pt is the visible gap between the title bar and the stats. Keep it in
    // step with the visible reserve below the stats (headerOverlapReserve
    // minus bodyOverlapPull) so the figure sits in the middle of the tinted
    // band: 48px above (pt-12) and 48px below (128-80 / 160-112).
    //
    // Stacked below ~700px of the main column so a headline figure and the
    // stock filter cluster cannot overlap. Side-by-side once both columns fit.
    //
    // `items-center`, not `items-end`: `bandActions` is the taller column, so
    // it sets the row height either way, but bottom-aligning the stats parked
    // the headline figure down against the card below.
    "flex min-w-0 flex-col gap-4 px-4 pt-12 sm:px-0",
    "@min-[700px]:flex-row @min-[700px]:items-center @min-[700px]:justify-between",
    overlap ? headerOverlapReserve : "pb-12",
  );
  const statCellClassName = cn(
    "px-2",
    statsAlign === "start" ? "text-left" : "text-center",
  );

  return (
    // `@container` so the glass panel below can size its inset off the main
    // column's actual width, which the collapsible sidebar changes at a fixed
    // viewport width.
    <header className="@container relative">
      {/* The glass sits behind the content as its own inset layer rather than
          as the header's background. Padding the header itself would shrink
          the container inside it and drag the title bar out of line with the
          cards below, so the inset lives here where it affects nothing else.

          The page behind is flat charcoal, so the blur has nothing to refract —
          the glass reads through the translucent primary gradient (brighter at
          the top, falling off downward), the hairline bottom edge, and the
          purple Level 2 depth. The backdrop filters still matter if anything
          ever scrolls beneath.

          `primary` at 25% over `canvas-soft` resolves to ~#322e38, a shade off
          `primary-pale` — the design system's tinted surface — so the tint
          stays on-palette instead of inventing a new background. The edge
          highlight stays white: a light specular line is what sells it as
          glass rather than a flat purple panel. */}
      {hasStatsBand && (
        <div
          aria-hidden="true"
          // Three regimes:
          //
          // Base is full-bleed, with a tighter radius because a 24px curve
          // reads oversized once the panel meets the column's edges.
          //
          // `@min-[1248px]` earns a 28px inset. That is where the inset stops
          // being wider than the resulting gap to the card edge: inside a
          // column of width M the card sits at max(0, (M-1200)/2) + 32, so
          // `gap >= 28` solves to M >= 1248. It's a *container* threshold, not
          // a viewport one, so it stays right when collapsing the sidebar
          // widens the column without the window changing.
          //
          // `max-sm` matches the title bar's outer edge: 16px is
          // `pageContainer`'s `px-4` at that width. The stats and band
          // actions get an extra `px-4` only at that same mobile breakpoint
          // so they sit in from the glass; `sm:` drops it. It stays
          // viewport-keyed because that px-4 is itself a media query, not
          // a container one.
          //
          // Full-bleed is the unprefixed base rather than an `sm:` rule
          // because Tailwind emits container-query and arbitrary variants
          // ahead of the built-in `sm:` — an `sm:` rule on these properties
          // would beat `@min-[1248px]` at every larger width. Bare utilities
          // always sort first, so the `@min-` rules override cleanly.
          className="pointer-events-none absolute inset-y-0 right-0 left-0 rounded-b-md border-b border-ink-deep/15 bg-gradient-to-b from-primary/25 via-primary/12 to-primary/5 shadow-level2 backdrop-blur-2xl backdrop-saturate-150 max-sm:right-4 max-sm:left-4 max-sm:rounded-b-xl @min-[1248px]:right-7 @min-[1248px]:left-7 @min-[1248px]:rounded-b-xl"
        />
      )}

      {/* `relative` keeps the content painting above the glass layer. */}
      <div className="relative">
        {/* Outer padding from `pageContainer` puts the bar's edges on the same
          line as the cards below it; the inner px matches those cards' own
          padding, so the title lines up with a card's heading. The -m-2 on the
          icon buttons cancels their hit-area padding so the glyphs sit on that
          same line rather than 8px inside it. */}
        <div className={pageContainer}>
          {/* Border and elevation echo the cards below. The 1px border is also
            load-bearing for alignment: it matches the cards' own border, which
            lands the title on the exact same content line as a card heading. */}
          <div className="rounded-b-xl border border-primary/10 bg-canvas px-4 shadow-level3 sm:px-8">
            {/* Wraps on mobile: the title row keeps the title and the settings
                icon, and `actions` drops to a full-width second line rather
                than squeezing to the point of clipping its own placeholder. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-3 py-3 sm:gap-x-4 sm:py-4">
              {/* min-h-11 matches the search field's rendered 44px so the bar
                  is the same height whether or not a page passes `actions`.
                  The gear alone is only 36px, which left pages without a
                  search sitting 8px shorter. */}
              <div className="flex min-h-11 min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMobile}
                  className="-ml-2 cursor-pointer rounded-lg p-2 text-ink transition-colors hover:bg-primary/10 md:hidden"
                  aria-label="Toggle Menu"
                >
                  <Menu className="h-6 w-6" />
                </button>

                <h1 className="truncate font-display text-display-xs text-ink">
                  {title}
                </h1>
              </div>

              {actions && (
                <div className="order-last flex w-full items-center sm:order-none sm:w-auto sm:min-w-0 sm:flex-1 sm:justify-end">
                  {actions}
                </div>
              )}

              <Link
                href="/settings"
                aria-label="Settings"
                title="Settings"
                className={cn(
                  "-mr-2 shrink-0 cursor-pointer rounded-full p-2 transition-colors hover:bg-primary/10",
                  pathname.startsWith("/settings")
                    ? "text-primary"
                    : "text-ink",
                )}
              >
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {hasStatsBand && (
          <div className={pageContainer}>
            <div className={bandClassName}>
              <div className="min-w-0 flex-1">
                {stats && stats.length > 0 && (
                  <div className={statsGridClassName}>
                    {stats.map((stat) => (
                      <div key={stat.label} className={statCellClassName}>
                        {/* Steps down at narrow widths so long currency values
                            don't collide with the neighbouring column or clip
                            off-screen. */}
                        <p className="font-display text-display-xs font-extrabold text-ink tabular-nums sm:text-display-sm xl:text-display-md">
                          <RollingNumber value={stat.value} />
                        </p>
                        {/* A `\n` in a label is a soft hint: collapsed to a
                            space at every width except the tablet band, where
                            columns are narrowest and a long label reads better
                            broken. */}
                        <p className="mt-1 text-caption uppercase tracking-wider text-body md:whitespace-pre-line lg:whitespace-normal">
                          {stat.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {!stats && statsLoading ? (
                  <div className={statsGridClassName}>
                    {Array.from({ length: statsLoading }, (_, i) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length skeleton, no identity
                        key={i}
                        className={cn(
                          "flex flex-col px-2",
                          statsAlign === "start"
                            ? "items-start"
                            : "items-center",
                        )}
                      >
                        <Skeleton className="h-8 w-32 max-w-full sm:w-40 xl:h-9" />
                        <Skeleton className="mt-2 h-3 w-28 max-w-full" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {bandActions && (
                <div className="w-full min-w-0 @min-[700px]:w-auto @min-[700px]:shrink-0">
                  {bandActions}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
