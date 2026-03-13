"use client";

import Lottie from "lottie-react";
import loadingBlocks from "./LoadingBlocks.json";

export function FullScreenLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-40 h-40 sm:w-48 sm:h-48">
        <Lottie
          animationData={loadingBlocks}
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>
    </div>
  );
}

