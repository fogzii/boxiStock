import { Badge } from "@box-ds";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

interface NavListItemProps {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
  badge?: number;
}

export function NavListItem({
  href,
  icon: Icon,
  label,
  isCollapsed,
  onClick,
  badge,
}: NavListItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const hasBadge = typeof badge === "number" && badge > 0;
  const badgeLabel = hasBadge ? (badge > 9 ? "9+" : String(badge)) : "";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center py-2.5 rounded-lg transition-colors group relative cursor-pointer",
        isCollapsed ? "px-4 md:px-0 md:justify-center" : "gap-3 px-4",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-primary/5",
      )}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />

      {/* Collapsed: small dot indicator near the top-right of the icon */}
      {hasBadge && isCollapsed && (
        <span className="hidden md:block absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-background" />
      )}

      <span
        className={cn(
          "text-body-sm-strong whitespace-nowrap transition-all duration-300",
          isCollapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100",
        )}
      >
        {label}
      </span>

      {/* Expanded: count pill at the right of the row */}
      {hasBadge && (
        <Badge
          variant="default"
          className={cn(
            "ml-auto h-5 min-w-5 justify-center px-1.5",
            isCollapsed && "md:hidden",
          )}
        >
          {badgeLabel}
        </Badge>
      )}
    </Link>
  );
}
