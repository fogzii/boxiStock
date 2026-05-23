import { Badge } from "@box-ds";

interface StockStatusBadgeProps {
  isStocked: boolean;
}

export function StockStatusBadge({ isStocked }: StockStatusBadgeProps) {
  return (
    <Badge variant={isStocked ? "positive" : "warning"}>
      {isStocked ? "In Stock" : "Pending"}
    </Badge>
  );
}
