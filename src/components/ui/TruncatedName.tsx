import { cn } from "@/lib/utils";

export function TruncatedName({
  children,
  className,
  maxWidth,
}: {
  children: string;
  className?: string;
  maxWidth: number;
}) {
  return (
    <span
      className={cn("min-w-0 truncate", className)}
      style={{ maxWidth }}
      title={children}
    >
      {children}
    </span>
  );
}
