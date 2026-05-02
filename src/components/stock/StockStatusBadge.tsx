import { Badge } from "@/components/ui/badge";

interface StockStatusBadgeProps {
  isStocked: boolean;
}

export function StockStatusBadge({ isStocked }: StockStatusBadgeProps) {
  return (
    <Badge
      variant={isStocked ? "default" : "secondary"}
      className={
        isStocked
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20 px-1.5 py-0 text-[10px]"
          : "bg-amber-500/15 text-amber-400 border-amber-500/20 px-1.5 py-0 text-[10px]"
      }
    >
      {isStocked ? "In Stock" : "Pending"}
    </Badge>
  );
}
