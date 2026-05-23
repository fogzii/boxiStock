"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface SidebarProfileProps {
  isCollapsed: boolean;
}

export function SidebarProfile({ isCollapsed }: SidebarProfileProps) {
  const { user } = useUser();
  const containerRef = useRef<HTMLDivElement>(null);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const displayName =
    user?.username ??
    user?.fullName ??
    user?.firstName ??
    email.split("@")[0] ??
    "User";

  const triggerClerkButton = () => {
    const clerkTrigger = containerRef.current?.querySelector("button");
    clerkTrigger?.click();
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isClerkButton =
      target.closest(".cl-userButtonBox") ||
      target.closest(".cl-userButtonTrigger");
    if (!isClerkButton) triggerClerkButton();
  };

  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      const target = e.target as HTMLElement;
      if (target.closest(".cl-userButtonBox")) return;
      e.preventDefault();
      triggerClerkButton();
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: cannot use <button> because Clerk's <UserButton/> already renders a nested <button>, which would be invalid HTML
    <div
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-label={`Account menu for ${displayName}`}
      onClick={handleContainerClick}
      onKeyDown={handleContainerKeyDown}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer",
        isCollapsed && "md:justify-center md:p-2",
      )}
    >
      {/* Clerk UserButton (avatar + dropdown with sign-out, account management) */}
      <UserButton
        appearance={{
          elements: {
            avatarBox: "w-9 h-9 ring-2 ring-primary/20",
            userButtonPopoverCard: {
              transform: "translate(-14px, -16px)",
            },
          },
        }}
      />

      {/* Name & email */}
      <div
        className={cn(
          "flex flex-col min-w-0 flex-1 transition-all duration-300",
          isCollapsed ? "md:hidden" : "",
        )}
      >
        <span className="text-body-sm-strong text-foreground truncate">
          {displayName}
        </span>
        <span className="text-caption text-body truncate">{email}</span>
      </div>
    </div>
  );
}
