"use client";

import { SearchInput as SearchInputBase } from "@box-ds";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

interface SearchInputProps {
  placeholder?: string;
  containerClassName?: string;
}

export function SearchInput({
  placeholder = "Search...",
  containerClassName,
}: SearchInputProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();

  const [searchTerm, setSearchTerm] = React.useState(
    searchParams.get("search") || "",
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const currentUrlSearch = searchParams.get("search") || "";
      if (searchTerm === currentUrlSearch) return;

      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm) {
          params.set("search", searchTerm);
        } else {
          params.delete("search");
        }
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, pathname, router, searchParams]);

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
