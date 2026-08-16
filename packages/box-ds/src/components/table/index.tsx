"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type * as React from "react";

import { cn } from "../../utils/cn";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full min-w-0 max-w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-body-sm", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-canvas-soft text-body-sm-strong [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-canvas-soft data-[state=selected]:bg-primary-pale",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 bg-canvas-soft px-2 text-left align-middle text-caption text-body uppercase tracking-wide whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle text-body-sm whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-body-sm text-body", className)}
      {...props}
    />
  );
}

function SortableTableHead({
  children,
  active,
  direction,
  align = "left",
  onToggle,
  className,
}: {
  children: React.ReactNode;
  active: boolean;
  direction: "asc" | "desc";
  align?: "left" | "right";
  onToggle: () => void;
  className?: string;
}) {
  const icon = active ? (
    direction === "asc" ? (
      <ArrowUp className="h-3 w-3 text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 text-primary" />
    )
  ) : (
    <ArrowUpDown className="h-3 w-3 opacity-30" />
  );

  return (
    <TableHead className={cn(className, align === "right" && "text-right")}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full cursor-pointer items-center gap-1 uppercase tracking-wide transition-colors select-none",
          align === "right" && "justify-end",
          active ? "text-foreground" : "hover:text-foreground",
        )}
      >
        {align === "right" && icon}
        {children}
        {align !== "right" && icon}
      </button>
    </TableHead>
  );
}

export {
  SortableTableHead,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
};
