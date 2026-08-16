"use client";

import { SearchInput as SearchInputBase } from "@box-ds";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

interface UrlSearchInputProps {
  placeholder?: string;
  containerClassName?: string;
  paramKey?: string;
  pageParamKey?: string;
  onNavigate?: (url: string) => void;
  isPending?: boolean;
}

export function UrlSearchInput({
  placeholder = "Search...",
  containerClassName,
  paramKey = "search",
  pageParamKey = "page",
  onNavigate,
  isPending: externalPending,
}: UrlSearchInputProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [localPending, startTransition] = React.useTransition();

  const [searchTerm, setSearchTerm] = React.useState(
    searchParams.get(paramKey) || "",
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const currentUrlSearch = searchParams.get(paramKey) || "";
      if (searchTerm === currentUrlSearch) return;

      const params = new URLSearchParams(searchParams.toString());
      if (searchTerm) {
        params.set(paramKey, searchTerm);
      } else {
        params.delete(paramKey);
      }
      params.delete(pageParamKey);
      const url = `${pathname}?${params.toString()}`;

      if (onNavigate) {
        onNavigate(url);
        return;
      }

      startTransition(() => {
        router.push(url, { scroll: false });
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [
    searchTerm,
    pathname,
    router,
    searchParams,
    paramKey,
    pageParamKey,
    onNavigate,
  ]);

  return (
    <SearchInputBase
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      isPending={externalPending || localPending}
      containerClassName={containerClassName}
    />
  );
}
