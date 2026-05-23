import type { LucideIcon } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string;
  icon: LucideIcon;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  className,
  ...props
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-primary/5 border border-primary/10 p-6 rounded-2xl relative overflow-hidden group",
        className,
      )}
      {...props}
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
      <div className="flex justify-between items-start mb-4">
        <span className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-6 h-6" />
        </span>
      </div>
      <p className="text-muted-foreground text-caption mb-1 uppercase tracking-wider">
        {title}
      </p>
      <h3 className="font-display text-display-md text-foreground">{value}</h3>
    </div>
  );
}
