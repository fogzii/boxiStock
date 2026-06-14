"use client";

import Lottie from "lottie-react";
import loadingBlocks from "./LoadingBlocks.json";

// Loaded only via next/dynamic from fullScreenLoading.tsx so lottie-react and
// the animation JSON stay out of the critical bundle. Do not import this
// module statically.
export default function LottieLoadingBlocks() {
  return (
    <Lottie
      animationData={loadingBlocks}
      loop
      autoplay
      style={{ width: "100%", height: "100%" }}
    />
  );
}
