"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

function ScrollRestorerInner({ scrollKey }: { scrollKey: string }) {
  const searchParams = useSearchParams();
  const page = searchParams.get("page") ?? "1";
  const prevPageRef = useRef(page);

  useEffect(() => {
    if (prevPageRef.current === page) return;
    prevPageRef.current = page;
    const saved = sessionStorage.getItem(`scroll-${scrollKey}`);
    if (!saved) return;
    sessionStorage.removeItem(`scroll-${scrollKey}`);
    requestAnimationFrame(() => {
      window.scrollTo({ top: Number(saved), behavior: "instant" });
    });
  }, [page, scrollKey]);

  return null;
}

export function ScrollRestorer({ scrollKey }: { scrollKey: string }) {
  return (
    <Suspense>
      <ScrollRestorerInner scrollKey={scrollKey} />
    </Suspense>
  );
}
