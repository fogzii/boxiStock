/**
 * The single content column shared by the page header and the page body, so
 * the header's title/stats always line up with the content beneath it.
 * Change it here and both stay in sync.
 */
export const pageContainer = "mx-auto w-full max-w-[1200px] px-4 sm:px-8";

/**
 * Opaque card surface used when a body card straddles the tinted header band.
 */
export const surfaceOnHeader = "border-transparent bg-canvas shadow-level3";

/**
 * Paired spacing that lets the first card in the body straddle the tinted
 * header band instead of starting below it: the header reserves extra space
 * under its stats, and the body is pulled back up over that reserve.
 *
 * The pull is how far the card rises into the band (the overlap); the
 * difference between the two is the visible gap between the stats and the
 * card. Keep them in sync - editing one alone changes both.
 */
export const headerOverlapReserve = "pb-32 sm:pb-40";
export const bodyOverlapPull = "-mt-20 sm:-mt-28";
