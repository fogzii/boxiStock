"use client";

import dynamic from "next/dynamic";

// Lazy-loaded so lottie-react (+28K animation JSON) stays out of the critical
// bundle of every page that imports this overlay. The chunk fetches on first
// show (a blink on a warm connection) and is cached for the session.
const LottieLoadingBlocks = dynamic(() => import("./lottieLoadingBlocks"), {
  ssr: false,
});

export function FullScreenLoading({ contained }: { contained?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`${contained ? "absolute" : "fixed"} inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm`}
    >
      <div className="h-40 w-40 sm:h-48 sm:w-48">
        <LottieLoadingBlocks />
      </div>
    </div>
  );
}
