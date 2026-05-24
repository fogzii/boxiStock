"use client";

import { Search } from "lucide-react";
import type * as React from "react";
import { cn } from "../../utils/cn";
import { Input } from "../input";

export interface SearchInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isPending?: boolean;
  containerClassName?: string;
}

export function SearchInput({
  isPending = false,
  className,
  containerClassName,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full max-w-[360px]", containerClassName)}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search
          className={cn(
            "w-4 h-4 transition-colors",
            isPending ? "text-primary animate-pulse" : "text-mute",
          )}
        />
      </div>
      <Input
        type="search"
        className={cn("pl-9 h-9 text-body-sm w-full", className)}
        {...props}
      />
    </div>
  );
}
