"use client";

import { SearchInput as SearchInputBase } from "@box-ds";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

interface SearchInputProps {
  placeholder?: string;
  containerClassName?: string;
  paramKey?: string;
  pageParamKey?: string;
}

export function SearchInput({
  placeholder = "Search...",
  containerClassName,
  paramKey = "search",
  pageParamKey = "page",
}: SearchInputProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const [searchTerm, setSearchTerm] = React.useState(
    searchParams.get(paramKey) || "",
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const currentUrlSearch = searchParams.get(paramKey) || "";
      if (searchTerm === currentUrlSearch) return;

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm) {
          params.set(paramKey, searchTerm);
        } else {
          params.delete(paramKey);
        }
        params.delete(pageParamKey);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, pathname, router, searchParams, paramKey, pageParamKey]);

  return (
    <SearchInputBase
      placeholder={placeholder}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      isPending={isPending}
      containerClassName={containerClassName}
    />
  );
}
