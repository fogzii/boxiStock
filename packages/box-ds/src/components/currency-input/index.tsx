import type * as React from "react";

import { cn } from "../../utils/cn";
import { Input } from "../input";

interface CurrencyInputProps extends React.ComponentProps<"input"> {
  symbol?: string;
  error?: boolean;
}

export function CurrencyInput({
  className,
  symbol = "$",
  error,
  ...props
}: CurrencyInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-body-sm text-body pointer-events-none select-none">
        {symbol}
      </span>
      <Input className={cn("pl-7", className)} error={error} {...props} />
    </div>
  );
}
