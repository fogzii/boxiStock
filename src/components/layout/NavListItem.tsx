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
}

export function NavListItem({
  href,
  icon: Icon,
  label,
  isCollapsed,
  onClick,
}: NavListItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center py-2.5 rounded-lg transition-colors group relative",
        isCollapsed ? "px-4 md:px-0 md:justify-center" : "gap-3 px-4",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
      )}
      title={isCollapsed ? label : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span
        className={cn(
          "text-body-sm-strong whitespace-nowrap transition-all duration-300",
          isCollapsed ? "md:opacity-0 md:w-0 overflow-hidden" : "opacity-100",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
