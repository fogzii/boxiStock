import {
  bodyOverlapPull,
  pageContainer,
} from "@/components/layout/pageContainer";
import { cn } from "@/lib/utils";

/**
 * The content column beneath a `PageHeader`. Shares `pageContainer` with the
 * header so the two stay horizontally aligned.
 *
 * `overlap` pulls the body up so its first card straddles the header's bottom
 * edge. Pair it with `<PageHeader overlap />`, which reserves the tinted-band
 * space the card rises into.
 */
export function PageBody({
  children,
  overlap,
  className,
}: {
  children: React.ReactNode;
  overlap?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        pageContainer,
        "min-w-0 animate-in fade-in slide-in-from-bottom-4 pb-8 duration-500",
        // `relative` is load-bearing: the glass panel is absolutely
        // positioned, which paints above plain in-flow blocks. Making the body
        // positioned too puts them on equal footing, so DOM order wins and the
        // card sits on top of the glass.
        //
        // Deliberately no z-index. Overlay portals (e.g. the row action menus)
        // mount at the end of <body> with an effective z-index of 0, so any
        // positive z-index here would paint the page content over them.
        overlap ? cn(bodyOverlapPull, "relative") : "pt-6 sm:pt-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
